# Sourcebit Wordpress Plugin

[Sourcebit](https://github.com/stackbithq/sourcebit) is designed to make it easier to connect JAMstack sites to external data. For instance, you can do things like pull content and assets from Sanity to your Hugo site. You can learn more about how Sourcebit works and how to use it in [this tutorial](https://www.stackbit.com/blog/data-driven-jamstack-sourcebit/).

Sourcebit is also fully extensible, allowing anyone to write plugins that pull from a variety of sources. This project is intended as an example plugin that connects to a Wordpress API supplied by the user. **While it works, it is intended purely for example purposes.**

## Known Issues

Some known issues that would need to be resolved before this would be useful for actual production use:

1. *Handle custom content types and data.* Right now the plugin has hardcoded the content models to match the default for posts and pages only.
2. *Fix Markdown rendering.* Right now the plugin uses a library called Turndown to convert the rendered content to Markdown. Unfortunately, this library still seems to be too aggressive in removing items and has difficulty handling nested items (i.e. I want to remove figure but leave the nested img or iframe). This can be left as HTML in the content body, but probably isn't what people would expect. Or perhaps the library can be tweaked to better handle this conversion.

## Using the Plugin

As it is not listed in the Sourcebit plugin index, if you would like to use this library you will need to download the source locally and then, in your project add a JSON file with contents like the following (replacing the path to the module with your local path):

```javascript
[
    {
    "module": "/Path/To/My/Plugin/sourcebit-source-wordpress",
    "description": "A Sourcebit plugin for Wordpress",
    "author": "Brian Rinaldi",
    "type": "source"
    }
]
```
Next, when running `create-sourcebit` you can append the JSON file, which will use the local copy of this plugin (replacing `[jsonfilename]` with your filename).

```bash
npx create-sourcebit --plugins=[jsonfilename].json 
```
