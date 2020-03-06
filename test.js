var WPAPI = require( 'wpapi' );

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
        const site = await WPAPI.discover('http://testssite.local/')
        console.log(site);
    }
    catch (error) {
        console.log(error);
    }
})();