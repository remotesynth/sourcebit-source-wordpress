const WPAPI = require('wpapi');
const TurndownService = require('turndown');
const pkg = require("./package.json");

module.exports.name = pkg.name;

const turndownService = new TurndownService();
  turndownService.keep(['iframe'])

module.exports.options = {
  wpapiURL: {
    env: "WPAPI_URL",
    private: true
  },
  watch: {
    default: false,
    runtimeParameter: "watch"
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
  const site = await WPAPI.discover(options.wpapiURL);

  if (context && context.entries) {
    log(`Loaded ${context.entries.length} entries from cache`);
  } else {
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

  if (options.watch) {
    setInterval(async () => {
      const { assets, entries } = getPluginContext();
      const posts = await site.posts();
      const pages = await site.pages();
      const allEntries = posts.concat(pages);
      const media = await site.media();
      let entryUpdateCompleted = false;

      // Handling updated assets.
      media.forEach(asset => {
        const index = assets.findIndex((item) => item.id === asset.id);

        if (index !== -1) {
          let newUpdateDate = new Date(asset.modified);
          let lastUpdateDate = new Date(assets[index].modified);
          if (newUpdateDate > lastUpdateDate) {
            assets[index] = asset;
            entryUpdateCompleted = true;
          }
        }
      });
      // handling entry updates
      allEntries.forEach(entry => {
        const index = entries.findIndex((item) => item.id === entry.id);

        if (index !== -1) {
          let newUpdateDate = new Date(entry.modified);
          let lastUpdateDate = new Date(entries[index].modified);
          if (newUpdateDate > lastUpdateDate) {
            entries[index] = entry;
            entryUpdateCompleted = true;
          }
        }
      });

      if (entryUpdateCompleted) {
        setPluginContext({assets,entries});
        refresh();
        log(`Updated entries`);
      }
      else
        return;

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