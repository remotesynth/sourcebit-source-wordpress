const WPAPI = require('wpapi');
const TurndownService = require('turndown');
const pkg = require("./package.json");

module.exports.name = pkg.name;

const turndownService = new TurndownService();
  turndownService.keep(['figure', 'iframe'])

module.exports.options = {
  wpapiURL: {
    env: "WPAPI_URL",
    private: true
  },
  watch: {
    // 👉 By default, the value of this option will be `false`.
    default: false,

    // 👉 The value for this option will be read from the `watch`
    // runtime parameter, which means that if the user starts
    // Sourcebit with `sourcebit fetch --watch`, then the value
    // of this option will be set to `true`, regardless of any
    // other value defined in the configuration file.
    runtimeParameter: "watch"
  },
  titleCase: {
    default: false
  }
};

module.exports.bootstrap = async ({
  debug,
  getPluginContext,
  log,
  options,
  refresh,
  setPluginContext
}) => {

  const context = getPluginContext();

  if (context && context.entries) {
    log(`Loaded ${context.entries.length} entries from cache`);
  } else {
    const site = await WPAPI.discover('http://testsite.local/');
    const posts = await site.posts();
    const pages = await site.pages();
    const entries = posts.concat(pages);
    const assets = await site.media();
    const fieldnames = ['title','content','excerpt','date','slug'];
    const models = [
      {
        id: 1,
        source: pkg.name,
        modelName: 'post',
        modelLabel: 'Posts',
        fieldNames: fieldnames,
        projectId: '',
        projectEnvironment: ''
      },
      {
        id: 2,
        source: pkg.name,
        modelName: 'page',
        modelLabel: 'Pages',
        fieldNames: fieldnames,
        projectId: '',
        projectEnvironment: ''
      }
    ];

    log(`Loaded ${entries.length} entries`);
    debug("Initial entries: %O", entries);

    setPluginContext({
      assets,
      entries,
      models
    });
  }

  // 👉 If the `watch` option is enabled, we set up a polling routine
  // that checks for changes in the data source. In a real-world plugin,
  // you'd be doing things like making regular calls to an API to check
  // whenever something changes.
  if (options.watch) {
    setInterval(() => {
      const { entries } = getPluginContext();
      const entryIndex = Math.floor(Math.random() * entries.length);

      entries[entryIndex].body = entries[entryIndex].body + " (updated)";

      log(`Updated entry #${entryIndex}`);
      debug("Updated entries: %O", entries);

      // 👉 We take the new entries array and update the plugin context.
      setPluginContext({ entries });

      // 👉 After updating the context, we must communicate the change and
      // the need for all plugins to re-run in order to act on the new data.
      refresh();
    }, 3000);
  }
};

module.exports.transform = ({
  data,
  debug,
  getPluginContext,
  log,
  options
}) => {
  const { assets, entries, models } = getPluginContext();

  const normalizedPosts = entries.map(entry => {
    const normalizedEntry = {
      source: pkg.name,
      id: entry.id,
      modelName: entry.type,
      modelLabel: entry.type.charAt(0).toUpperCase() + entry.type.slice(1) + 's',
      projectId: '',
      projectEnvironment: '',
      createdAt: entry.date,
      updatedAt: entry.modified
    }

    return {
      title: turndownService.turndown(entry.title.rendered),
      content: turndownService.turndown(entry.content.rendered),
      excerpt: turndownService.turndown(entry.content.rendered),
      date: entry.date,
      slug: entry.slug,
      __metadata: normalizedEntry
    };
  });

  const normalizedAssets = assets.map(asset => {
    const normalizedEntry = {
      source: pkg.name,
      id: asset.id,
      modelName: '__asset',
      modelLabel: 'Assets',
      projectId: '',
      projectEnvironment: '',
      createdAt: asset.date,
      updatedAt: asset.modified,
    }

    return {
      title: turndownService.turndown(asset.title.rendered),
      contentType: asset.mime_type,
      fileName: asset.media_details.sizes.full.file,
      url: asset.media_details.sizes.full.source_url,
      __metadata: normalizedEntry
    };
  });

  const normalizedEntries = normalizedPosts.concat(normalizedAssets);

  return {
    ...data,
    models: data.models.concat(models),
    objects: data.objects.concat(normalizedEntries)
  };
};

module.exports.getSetup = ({
  chalk,
  context,
  currentOptions,
  data,
  debug,
  getSetupContext,
  inquirer,
  ora,
  setSetupContext
}) => {
  return async () => {
    const answers = {};
    const { wpapiURL } = await inquirer.prompt([
      {
        type: "input",
        name: "wpapiURL",
        message: 'What is the root URL for your Wordpress API?',
        validate: value =>
          value.length > 0
            ? true
            : "The URL cannot be empty.",
        default: currentOptions.wpapiURL
      }
    ]);
    answers.wpapiURL = wpapiURL;
    const spinner = ora("Verifying space...").start();
    try {
      let site = await WPAPI.discover(answers.wpapiURL);
    } catch (error) {
      spacesSpinner.fail();
      throw error;
    }
    spinner.succeed();
    return answers;
  }
};

module.exports.getOptionsFromSetup = ({
  answers,
  debug,
  getSetupContext,
  setSetupContext
}) => {
  return {
    wpapiURL: answers.wpapiURL
  };
};