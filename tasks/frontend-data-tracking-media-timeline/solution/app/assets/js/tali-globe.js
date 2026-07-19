$( function() {

    if ( !taliConfig.enableSmallGlobe ) return;

    const container = $( ".small-globe" ).get( 0 );

    const camera = new THREE.PerspectiveCamera( 60, 100 / 100, 1, 50000 );
    camera.position.z = 500;

    const scene = new THREE.Scene();

    const ambLight = new THREE.AmbientLight( 0xffffff, 1 );
    scene.add( ambLight );

    const group = new THREE.Group();
    scene.add( group );

    const loader = new THREE.TextureLoader();
    loader.load( rootUrl + '/assets/images/earth.png', function ( texture ) {

        const geometry = new THREE.SphereBufferGeometry( 196, 20, 20 );
        const material = new THREE.MeshLambertMaterial( { map: texture, opacity: 1 } );
        const earthLand = new THREE.Mesh( geometry, material );

        group.add( earthLand );

    } );

    const renderer = new THREE.WebGLRenderer( { alpha: true } );
    renderer.setSize( 512, 512 );

    container.appendChild( renderer.domElement );

    $( window ).on( "resize", () => {
        camera.aspect = 100 / 100;
        camera.updateProjectionMatrix();
        renderer.setSize( 512, 512 );
    } );
    
    function animate() {

        group.rotation.y -= 0.01;

        renderer.render( scene, camera );
        requestAnimationFrame( animate );
    }

    animate();


} );