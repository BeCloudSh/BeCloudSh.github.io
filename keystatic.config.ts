// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core';

export default config({
    // 'local' saves directly to your computer's file system during development
    storage: { kind: 'local' },

    collections: {
        blog: collection({
            label: 'Blog Posts',
            // This tells Keystatic to use the 'title' field to generate the URL slug and filename automatically
            slugField: 'title',
            // Where Astro Paper stores its posts
            path: 'src/data/blog/*',
            // This separates the frontmatter from the markdown body
            format: { contentField: 'content' },

            schema: {
                title: fields.slug({
                    name: { label: 'Title' }
                }),
                author: fields.text({
                    label: 'Author',
                    defaultValue: 'BeCloudSh'
                }),
                pubDatetime: fields.datetime({
                    label: 'Publish Date',
                    // Keystatic automatically outputs this as the ISO string you want: 2026-01-20T04:06:31Z
                }),
                slug: fields.text({
                    label: 'Custom Slug (URL)',
                    description: 'Overrides the URL. Leave blank to let Astro use the filename.'
                }),
                featured: fields.checkbox({
                    label: 'Featured',
                    defaultValue: false
                }),
                draft: fields.checkbox({
                    label: 'Draft',
                    defaultValue: false
                }),
                tags: fields.array(
                    fields.text({ label: 'Tag' }),
                    {
                        label: 'Tags',
                        itemLabel: props => props.value
                    }
                ),
                description: fields.text({
                    label: 'Description',
                    multiline: true
                }),
                // The main editor body
                content: fields.markdoc({
                    label: 'Content',
                    extension: "md",
                })
            },
        }),
    },
});