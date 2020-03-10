var WPAPI = require( 'wpapi' );
const TurndownService = require('turndown');
const turndownService = new TurndownService();
turndownService.keep(['iframe']);

/*WPAPI.discover('http://testsite.local/')
.then(function( site ) {
    wordpress can support custom types but we'll only deal with posts and pages for now
    site.types().then(function( types ) {
        console.log( types );
    });
    site.posts().then(function( posts ) {
        console.log( posts );
    });
    site.pages().then(function( pages ) {
        console.log( pages );
    });
    site.media().then(function( media ) {
        console.log( media );
    });
});*/
(async () => {
    try {
        const site = await WPAPI.discover('http://testsite.local/')
        const posts = await site.posts();
        const pages = await site.pages();
        const entries = posts.concat(pages);
        const assets = await site.media();
        const normalizedPosts = entries.map(entry => {
            const normalizedEntry = {
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
              __metadata: normalizedEntry
            };
          });
        
          const normalizedAssets = assets.map(asset => {
            const normalizedEntry = {
              id: asset.id,
              title: turndownService.turndown(asset.title.rendered),
              modelName: '__asset',
              modelLabel: 'Assets',
              projectId: '',
              projectEnvironment: '',
              createdAt: asset.date,
              updatedAt: asset.modified,
            }
        
            return {
              title: normalizedEntry.title,
              contentType: asset.mime_type,
              fileName: asset.media_details.sizes.full.file,
              url: asset.media_details.sizes.full.source_url,
              __metadata: normalizedEntry
            };
          });
        
          const normalizedEntries = normalizedPosts.concat(normalizedAssets);
        console.log(normalizedEntries);
    }
    catch (error) {
        console.log(error);
    }
})();