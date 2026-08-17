# Microsoft Entra Cloud Sync: gMSA Setup Fails with `0x8007200A` Due to AD Tiering

## Overview

During the installation of the Microsoft Entra Cloud Sync provisioning agent, the configuration wizard failed while creating and validating its group Managed Service Account (gMSA).

The wizard displayed the following error:

```text
Exception while trying to check if service account:
domain.loc\pGMSA_7e21fab0$ is a gMSA.

Exception:
System.Runtime.InteropServices.COMException (0x8007200A):
The specified directory service attribute or value does not exist.
```

The message initially suggested a damaged Active Directory schema, a missing gMSA attribute, or an invalid Managed Service Accounts container.

The actual cause was different:

> An Active Directory tiering policy prevented the privileged account from being used on the server where the Cloud Sync agent was being installed.

The account logged on to the server was not the Domain Admin account entered in the wizard. At the same time, the Domain Admin account was intentionally denied logon to that server through **User Rights Assignment**.

Installing the agent directly on a domain controller succeeded because the privileged account was permitted to operate in that Tier 0 context.

---

## Environment

The relevant components were:

- Microsoft Entra Cloud Sync provisioning agent
- Active Directory Domain Services
- Group Managed Service Account created by the Cloud Sync wizard
- Active Directory administrative tiering
- A dedicated Windows Server intended to host the provisioning agent
- Domain controllers in the Tier 0 administrative boundary

Microsoft Entra Cloud Sync supports and recommends using a gMSA for the provisioning-agent service. The installer can either create the gMSA or use a custom account.

---

## The error

The setup reached the **Configure Service Account** stage and created an account with a name similar to:

```text
pGMSA_7e21fab0$
```

Shortly afterwards, the wizard failed with:

```text
0x8007200A
The specified directory service attribute or value does not exist.
```

The corresponding Netlogon event provided the more useful detail.

### Event ID 9002

```text
Log:
Microsoft-Windows-Security-Netlogon/Operational

Event ID:
9002

Message:
Netlogon failed to add pGMSA_7e21fab0$ as a managed service
account to this local machine. The object was not found.
```

Microsoft specifically recommends checking the **Security-Netlogon Operational** log and Events 9001 and 9002 when the Cloud Sync provisioning agent cannot install its gMSA.

---

## Initial interpretation

The error appeared to indicate that Active Directory could not find the newly created gMSA.

However, after the failed installation:

- The gMSA existed in Active Directory.
- The object was visible on both domain controllers.
- The gMSA could be retrieved with `Get-ADServiceAccount`.
- `Test-ADServiceAccount` returned `True`.
- The Managed Service Accounts container existed.
- The required schema class and attributes were present.
- The setup account had Domain Admin and Enterprise Admin membership.

This made a general schema, KDS, replication, or Active Directory permissions problem unlikely.

The important missing detail was the **effective Windows security context on the provisioning-agent server**.

---

# Root cause

## Active Directory tiering affected the installation context

The environment used Active Directory administrative tiering.

The server intended to host the Cloud Sync provisioning agent was not part of the same administrative logon boundary as the domain controllers.

Two identities were involved:

1. The Windows account logged on to the provisioning-agent server.
2. The Domain Admin account entered into the Cloud Sync wizard.

The logged-on Windows account was allowed to access the server but did not have all required Tier 0 privileges.

The Domain Admin account supplied to the wizard had the necessary Active Directory privileges but was deliberately prevented from logging on to the provisioning-agent server by the tiering policy.

The relevant policies were located under:

```text
Computer Configuration
└── Windows Settings
    └── Security Settings
        └── Local Policies
            └── User Rights Assignment
```

In particular, the effective configuration included restrictions such as:

```text
Deny log on locally
Deny log on through Remote Desktop Services
```

Depending on the design, other logon rights may also be relevant:

```text
Access this computer from the network
Deny access to this computer from the network
Log on as a service
Allow log on locally
Allow log on through Remote Desktop Services
```

The exact setting responsible depends on how the tiering policies and administrative groups are assigned. In this case, the decisive finding was that the Domain Admin account was intentionally not permitted to operate on the provisioning-agent server.

## Why the error was misleading

The wizard could authenticate the supplied credentials and perform Active Directory operations, including creation of the gMSA.

The failure occurred during the subsequent local installation and validation of the managed service account.

`Install-ADServiceAccount` does more than read an object from Active Directory. It installs an existing managed service account on the local computer, verifies that the computer is eligible to host it, and makes the required local changes.

The resulting failure sequence was therefore:

```text
Cloud Sync wizard creates the gMSA
                │
                ▼
The wizard starts the local gMSA installation
                │
                ▼
The administrative security contexts do not align
with the AD tiering and logon restrictions
                │
                ▼
Netlogon cannot complete the local gMSA operation
                │
                ▼
Event ID 9002 is generated
                │
                ▼
The wizard performs its follow-up gMSA validation
                │
                ▼
The wizard reports COMException 0x8007200A
```

The displayed LDAP-style error was therefore a **secondary symptom**, not the actual root cause.

---

# How the root cause was confirmed

The decisive test was to run the installation in an administrative context where the privileged account was permitted by the tiering model.

The provisioning agent was installed directly on a domain controller.

The installation completed successfully.

This demonstrated that:

- The forest schema supported gMSAs.
- The KDS root key was functional.
- The gMSA could be created.
- The required Active Directory objects existed.
- The administrative credentials had sufficient AD permissions.
- The failure depended on the security boundary of the original installation server.

The relevant difference was not Active Directory itself. It was the effective **User Rights Assignment** and administrative tier on the target server.

---

# Identifying the issue earlier

When the Cloud Sync wizard fails during gMSA creation or validation, check the following before investigating the AD schema.

## 1. Check the Security-Netlogon log

Open:

```text
Event Viewer
└── Applications and Services Logs
    └── Microsoft
        └── Windows
            └── Security-Netlogon
                └── Operational
```

Look for:

```text
Event ID 9001
Event ID 9002
```

Alternatively, run:

```powershell
$startTime = (Get-Date).AddMinutes(-15)

Get-WinEvent `
    -FilterHashtable @{
        LogName   = "Microsoft-Windows-Security-Netlogon/Operational"
        StartTime = $startTime
    } `
    -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Id -eq 9001 -or $_.Id -eq 9002
    } |
    Select-Object TimeCreated,Id,LevelDisplayName,Message |
    Format-List
```

Typical meanings include:

| Event | Message | Likely direction |
|---|---|---|
| 9001 | Encryption types are not supported | Compare the server and gMSA Kerberos encryption settings |
| 9002 | Access denied | Check whether the computer is authorized to retrieve the gMSA password |
| 9002 | Object not found | Check DC visibility, replication, account lifecycle and the installation security context |

The event text should be treated as the primary diagnostic signal. The final wizard exception may only represent a failed follow-up check.

## 2. Compare the identities involved

On the provisioning-agent server, run:

```powershell
[System.Security.Principal.WindowsIdentity]::GetCurrent().Name
whoami /upn
whoami /groups
```

Document separately:

- The account logged on to Windows
- The account used to start the elevated wizard
- The on-premises AD credentials entered into the wizard
- The Entra account used for tenant authentication
- The computer account of the provisioning-agent server
- The gMSA created or selected by the wizard

Do not assume that credentials entered into the wizard become the effective identity for every local operation performed by the setup workflow.

## 3. Check effective User Rights Assignment

Review the effective policy under:

```text
Computer Configuration
└── Windows Settings
    └── Security Settings
        └── Local Policies
            └── User Rights Assignment
```

Generate an effective Group Policy report:

```cmd
gpresult /h C:\Windows\Temp\CloudSync-GPResult.html
```

Review at least:

```text
Allow log on locally
Deny log on locally
Allow log on through Remote Desktop Services
Deny log on through Remote Desktop Services
Access this computer from the network
Deny access to this computer from the network
Log on as a service
```

Also check whether the account belongs to:

- A protected Tier 0 administrator group
- An authentication-policy silo
- A group explicitly denied access on the server
- A group permitted only on domain controllers or privileged-access workstations

A deny assignment takes precedence over an allow assignment.

---

# Solutions

The correct solution depends on the intended administrative-tiering design.

## Solution 1: Use a dedicated Tier 0 server for the provisioning agent

The preferred approach is to deploy the provisioning agent to a dedicated, hardened Tier 0 member server.

The server should:

- Be managed as part of the Tier 0 administrative boundary
- Permit the approved Tier 0 installation account
- Block lower-tier administrative accounts
- Use internal AD DNS
- Receive security policies appropriate for an identity infrastructure component
- Run the Cloud Sync service under its gMSA after installation

This preserves administrative separation without placing the agent directly on a domain controller.

## Solution 2: Use a dedicated installation account

Create or use a dedicated installation account that:

- Has the required Active Directory rights
- Is permitted to log on to the provisioning-agent server
- Is authorized by the administrative-tiering model
- Is used only for the installation and configuration process
- Is removed from unnecessary local access after the deployment

Avoid creating a broad permanent exception for all Domain Admin accounts.

## Solution 3: Adjust User Rights Assignment for a controlled group

If organizational policy permits it, assign the required right to a dedicated administrative group rather than directly to individual accounts.

For example:

```text
Cloud Sync Installation Administrators
```

Review both the allow and deny policies. Adding an account to **Allow log on locally** does not help if the same account or one of its groups is included in **Deny log on locally**.

The exception should be:

- Narrowly scoped
- Applied only to the provisioning-agent server
- Assigned to a dedicated group
- Documented
- Reviewed after installation
- Removed if no longer required

## Solution 4: Install on a domain controller

Installing the agent on a domain controller can technically avoid the tier mismatch if the privileged account is already permitted there.

In this case, it also provided the test that confirmed the root cause.

However, this should be a deliberate architecture decision rather than the default workaround. A dedicated Tier 0 member server generally provides clearer separation between the domain-controller role and additional identity infrastructure components.

---

# Recommended target design

A clean implementation could use the following model:

```text
Tier 0 Administrative Workstation
                │
                │ approved Tier 0 administration
                ▼
Dedicated Tier 0 Cloud Sync Server
                │
                │ service identity
                ▼
Cloud Sync gMSA
                │
                │ directory synchronization
                ▼
Active Directory Domain Services
```

Operationally:

- Administrators access the server only from an approved privileged-access workstation.
- A dedicated Tier 0 installation account is used for setup.
- The Cloud Sync service runs under the gMSA.
- Interactive Domain Admin usage is minimized.
- User Rights Assignment is centrally managed and documented.
- Multiple active Cloud Sync agents can be considered for availability according to the intended design.

---

# Conclusion

The Microsoft Entra Cloud Sync wizard reported:

```text
0x8007200A:
The specified directory service attribute or value does not exist.
```

The underlying issue was not a missing directory attribute.

The actual problem was an **administrative-tiering mismatch**:

- The account running the wizard locally did not have the required privileged context.
- The Domain Admin account entered into the wizard had the required Active Directory permissions.
- The Domain Admin account was not permitted to log on to the provisioning-agent server.
- The local gMSA installation failed through Netlogon.
- The wizard surfaced a misleading secondary LDAP exception.

The most valuable diagnostic path was:

```text
Wizard error
    ↓
Security-Netlogon Event 9002
    ↓
Compare local and supplied identities
    ↓
Review effective User Rights Assignment
    ↓
Identify the tiering restriction
```

For environments with Active Directory tiering, the provisioning-agent server must be treated as part of the appropriate identity-security boundary. The installation account, target server, local logon rights, and gMSA must all fit into the same administrative model.

---

# Appendix: Checks used to rule out other causes

The following checks were useful for excluding other possible causes. They were not part of the shortest path to the final diagnosis.

## A. Validate the KDS root key

```powershell
Get-KdsRootKey
```

If an organizational test function is available:

```powershell
Test-KdsRootKey
```

A valid KDS root key is required for gMSA password generation.

## B. Test the gMSA

```powershell
Test-ADServiceAccount -Identity "pGMSA_7e21fab0"
```

Expected:

```text
True
```

A successful result proves that the server can use the account at the time of the test. It does not necessarily prove that the wizard’s earlier installation attempt used the same effective context.

## C. Check the Managed Service Accounts container

```powershell
Import-Module ActiveDirectory

$domainDN = (Get-ADDomain).DistinguishedName
$msaDN = "CN=Managed Service Accounts,$domainDN"

Get-ADObject `
    -Identity $msaDN `
    -Properties objectClass,objectGUID |
    Select-Object DistinguishedName,ObjectClass,ObjectGUID |
    Format-List
```

Expected:

```text
ObjectClass : container
```

## D. Validate `otherWellKnownObjects`

The Managed Service Accounts well-known GUID is:

```text
1EB93889E40C45DF9F0C64D23BBB6237
```

Check the domain root:

```powershell
Import-Module ActiveDirectory

$domainDN = (Get-ADDomain).DistinguishedName

$domainObject = Get-ADObject `
    -Identity $domainDN `
    -Properties otherWellKnownObjects

$domainObject.otherWellKnownObjects |
    Where-Object {
        $_ -match "1EB93889E40C45DF9F0C64D23BBB6237"
    }
```

Expected:

```text
B:32:1EB93889E40C45DF9F0C64D23BBB6237:CN=Managed Service Accounts,DC=example,DC=com
```

## E. Compare the container across domain controllers

```powershell
Import-Module ActiveDirectory

$domainDN = (Get-ADDomain).DistinguishedName
$msaDN = "CN=Managed Service Accounts,$domainDN"

$dcNames = @(
    "dc01.example.com",
    "dc02.example.com"
)

foreach ($dcName in $dcNames) {
    $container = Get-ADObject `
        -Server $dcName `
        -Identity $msaDN `
        -Properties objectGUID,objectClass

    [PSCustomObject]@{
        DC          = $dcName
        ContainerDN = $container.DistinguishedName
        ObjectClass = $container.ObjectClass
        ObjectGUID  = $container.ObjectGUID
    }
} | Format-List
```

The same object GUID on all DCs confirms that the same container object has replicated.

## F. Validate the gMSA class in the schema

```powershell
Import-Module ActiveDirectory

$schemaDN = (Get-ADRootDSE).SchemaNamingContext

Get-ADObject `
    -SearchBase $schemaDN `
    -LDAPFilter "(lDAPDisplayName=msDS-GroupManagedServiceAccount)" `
    -Properties `
        lDAPDisplayName,
        schemaIDGUID,
        governsID,
        objectClassCategory,
        subClassOf,
        systemMustContain,
        systemMayContain,
        isDefunct |
    Select-Object `
        lDAPDisplayName,
        schemaIDGUID,
        governsID,
        objectClassCategory,
        subClassOf,
        systemMustContain,
        systemMayContain,
        isDefunct |
    Format-List
```

Expected core values:

```text
lDAPDisplayName     : msDS-GroupManagedServiceAccount
governsID           : 1.2.840.113556.1.5.282
objectClassCategory : 1
subClassOf          : computer
```

Expected schema GUID:

```text
7b8b558a-93a5-4af7-adca-c017e67f1057
```

## G. Validate the Cloud Sync schema prerequisite

Check for:

```text
msDS-ExternalDirectoryObjectId
```

```powershell
Import-Module ActiveDirectory

$schemaDN = (Get-ADRootDSE).SchemaNamingContext

Get-ADObject `
    -SearchBase $schemaDN `
    -LDAPFilter "(lDAPDisplayName=msDS-ExternalDirectoryObjectId)" `
    -Properties lDAPDisplayName,attributeID,schemaIDGUID,isDefunct |
    Select-Object `
        DistinguishedName,
        lDAPDisplayName,
        attributeID,
        schemaIDGUID,
        isDefunct |
    Format-List
```

## H. Check replication

```cmd
repadmin /replsummary
repadmin /showrepl *
dcdiag /e /test:Replications
```

For the gMSA object:

```powershell
$gmsaDN = (
    Get-ADServiceAccount -Identity "pGMSA_7e21fab0"
).DistinguishedName

repadmin /showobjmeta dc01.example.com "$gmsaDN"
repadmin /showobjmeta dc02.example.com "$gmsaDN"
```

## I. Check the server’s authorization to retrieve the password

```powershell
Import-Module ActiveDirectory

Get-ADServiceAccount `
    -Identity "pGMSA_7e21fab0" `
    -Properties PrincipalsAllowedToRetrieveManagedPassword |
    Select-Object `
        Name,
        SamAccountName,
        PrincipalsAllowedToRetrieveManagedPassword |
    Format-List
```

The provisioning-agent computer account, or an appropriate security group containing that computer, must be authorized.

If group membership was recently changed, refresh the machine’s Kerberos tickets:

```cmd
klist -li 0x3e7 purge
```

A server restart also refreshes the computer’s security context.

## J. Check Kerberos encryption types

Check the account:

```powershell
Get-ADServiceAccount `
    -Identity "pGMSA_7e21fab0" `
    -Properties msDS-SupportedEncryptionTypes |
    Select-Object Name,SamAccountName,msDS-SupportedEncryptionTypes |
    Format-List
```

Check the server policy:

```cmd
reg query "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\Kerberos\Parameters" /v SupportedEncryptionTypes
```

If the environment requires AES only:

```powershell
Set-ADServiceAccount `
    -Identity "pGMSA_7e21fab0" `
    -KerberosEncryptionType AES128,AES256
```

## K. Review the Cloud Sync trace

The trace folder is:

```text
C:\ProgramData\Microsoft\Azure AD Connect Provisioning Agent\Trace
```

Retrieve the newest trace files:

```powershell
$traceFolder = "C:\ProgramData\Microsoft\Azure AD Connect Provisioning Agent\Trace"

Get-ChildItem -LiteralPath $traceFolder -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 5 FullName,LastWriteTime,Length |
    Format-List
```

Search for the current account and exception:

```powershell
$latestLog = Get-ChildItem -LiteralPath $traceFolder -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

Select-String `
    -LiteralPath $latestLog.FullName `
    -SimpleMatch `
    -Pattern `
        "pGMSA_7e21fab0",
        "0x8007200A",
        "is a gmsa",
        "COMException" `
    -Context 20,10
```
