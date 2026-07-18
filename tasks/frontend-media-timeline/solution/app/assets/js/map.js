
function getCountryName( isoA2, lang = null ) {
    if ( !('countriesDict' in window ) ) return isoA2;
    if ( !lang ) {
        lang = window.currentLang;
    }
    if ( lang == 'en' ) {
        return countriesDict[ isoA2 ].country;
    }
    if ( lang == 'he' ) {
        return countriesDict[ isoA2 ].hebrew;
    }
    if ( 'countriesNames' in window ) {
        for ( const country of window.countriesNames ) {
            if ( country.alpha2 == isoA2.toLowerCase() ) {
                if ( lang in country ) {
                    return country[ lang ];
                }
            }
        }    
    }
    return isoA2;
}

class TaliMap {

    constructor( eventsData, countriesDict, countriesGeoJsonDataUrl ) {

        this.transitionDuration = 500;
        this.disableEventsToggle = false;
        this.$mapCountryName = $( "#map-country-name" );
        // this.$closeClsUpBtn = $( "#exit-close-up-btn" );
        this.$markerTemplate = $( document.getElementById( "map_marker_template" ).content ).find( ".map-marker" );

        this.initialMapCenter = [ 31.046, 34.8516 ];
        this.initialZoom = 2;
        this.minZoom = 0;
        this.maxZoom = 6;

        this.spinEnabled = false;
        this.secondsPerRevolution = 60;

        this.accessToken = 'pk.eyJ1Ijoibmlyc2giLCJhIjoiY20wbW1ndWtlMDNvOTJzc2IxdTlxZnA5YiJ9.WGWcX5P_glqbig97rmeM3A';

        Object.keys( countriesDict ).forEach( key => { countriesDict[ key ].events = []; } );        
        eventsData.forEach( event => {
            if ( !('country' in event ) ) return;
            for ( let countryCodeIdx in event.country ) {
                if ( event.country[ countryCodeIdx ] in countriesDict ) {
                    countriesDict[ event.country[ countryCodeIdx ] ].events.push( event );
                }
            }
        });
        this.countriesDict = countriesDict;

        this.isgeojsonDataLoaded = false;
        this.geojsonDataCallbacks = [];
        this.geojsonData = null;

        fetch( countriesGeoJsonDataUrl ).then( response => response.json() ).then( data => {
            this.geojsonData = data;
            this.isgeojsonDataLoaded = true;
            for ( let cbIdx in this.geojsonDataCallbacks ) {
                this.geojsonDataCallbacks[ cbIdx ].call( this, data );
            }
        } );

    }

    init() {
        if ( ! ( 'mapboxgl' in window ) ) return;

        mapboxgl.accessToken = this.accessToken;

        const map = new mapboxgl.Map( {
            container: 'map', 
            style: 'mapbox://styles/nirsh/cm03vzsaj00dm01pl3bj3hc0r', 
            center: this.initialMapCenter, 
            zoom: this.initialZoom,
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
        } );

        map.on( "style.load", () => {
            map.setFog( {
                'color': 'rgba( 0, 0, 0, 0 )',
                'high-color': 'rgba( 0, 0, 0, 0 )',
                'space-color': 'rgba( 0, 0, 0, 0 )',
                'star-intensity': 0,
            });
        } );

        Object.keys( this.countriesDict ).forEach( key => {
            const cd = this.countriesDict[ key ];

            if (key === 'PS') return;

            if (key === 'IL') {
                const psCountry = this.countriesDict['PS'];
                if (psCountry && psCountry.events.length > 0) {
                    cd.events = cd.events.concat(psCountry.events);  // Merge events from PS into IL
                }
            }

            if ( cd.events.length === 0 ) return;
            const $marker = this.$markerTemplate.clone();
            $marker.find( ".map-marker-number" ).html( cd.events.length );
            const marker = new mapboxgl.Marker( $marker.get( 0 ) ).setLngLat( cd.geo ).addTo( map );
            this.countriesDict[ key ].marker = marker;
            this.countriesDict[ key ].eventsCount = cd.events.length;
            
            // Add click handler to marker
            $( marker.getElement() ).on( 'click', ( e ) => {
                e.stopPropagation();
                if ( this.disableEventsToggle ) return;
                
                const isoA2 = key === 'PS' ? 'IL' : key;
                const countryInfo = this.countriesDict[ isoA2 ];
                const eventsLength = countryInfo?.eventsCount ?? 0;
                
                if ( eventsLength > 0 || ( key === 'PS' && this.countriesDict['IL'].eventsCount > 0 ) ) {
                    this.zoomCountry( isoA2 );
                    let yearParams = '';
                    if ( 'tali' in window ) {
                        yearParams = `/from:${tali.fromYear}/to:${tali.toYear}`
                    }
                    tali.saveState( "country-" + isoA2.toLowerCase() );
                }
            } );
        });

        this.filterMarkers();

        this.map = map;

        map.on( 'load', () => {

            const td = this.transitionDuration;

            var layersLineOpacityTransition = ['admin-0-boundary', 'admin-1-boundary', 'admin-0-boundary-disputed'];
            var layersFillOpacityTransition = ['water', 'landuse', 'land-structure-polygon', 'aeroway-polygon', 'building', 'national-park'];
            
            layersFillOpacityTransition.forEach(function(layer) {
                map.setPaintProperty(layer, 'fill-opacity-transition', {
                    duration: td, 
                });
            });
    
            layersLineOpacityTransition.forEach(function(layer) {
                map.setPaintProperty(layer, 'line-opacity-transition', {
                    duration: td, 
                });
            });
    
            map.setPaintProperty('land', 'background-opacity-transition', {
                duration: td,
            });

            if ( this.isgeojsonDataLoaded ) {
                this.startMap( this.geojsonData );
            } else {
                this.geojsonDataCallbacks.push( data => {
                    this.startMap( data );
                } );
            }

            map.setPaintProperty('water', 'fill-color', "#FFF4EF");
            map.setPaintProperty('land', 'background-color', "#FAEAE3");
            map.setPaintProperty('admin-0-boundary', 'line-color', '#D9C8C1');
            // map.setPaintProperty('cf', 'line-color', '#000000');
            // map.setPaintProperty('cf', 'line-opacity', 1);
            

        } );

        map.on('moveend', () => {
            this.spinGlobe();
        });
    
    }

    zoomOutMap(){
        const map = this.map;

        map.flyTo({
            zoom: this.initialZoom,
            duration: 1000
        });

        map.setPaintProperty('water', 'fill-opacity', 1);
        map.setPaintProperty('landuse', 'fill-opacity', 1);
        map.setPaintProperty('land-structure-polygon', 'fill-opacity', 1);
        map.setPaintProperty('aeroway-polygon', 'fill-opacity', 1);
        map.setPaintProperty('building', 'fill-opacity', 1);
        map.setPaintProperty('national-park', 'fill-opacity', 1);
        map.setPaintProperty('waterway', 'line-opacity', 1);
        map.setPaintProperty('land', 'background-opacity', 1);
        map.setPaintProperty('admin-0-boundary', 'line-opacity', 1);
        map.setPaintProperty('admin-1-boundary', 'line-opacity', 1);
        map.setPaintProperty( "admin-0-boundary-disputed", 'line-opacity', 1);  
        map.setPaintProperty('cf', 'fill-color', '#F87A62');

        
        
        
    }

    zoomOut() {
        const map = this.map;

        this.zoomOutMap()

        if ( 'tali' in window ) {
            window.tali.collapseTimelinesQuickly();
            setTimeout( () => {
                window.tali.currentCountry = null;
                this.filterMarkers() 
                map.scrollZoom.enable();
                map.dragPan.enable();
                this.disableEventsToggle = false;        
            }, 750 );
            setTimeout( () => {
                $('body').removeClass('country-page')
                $('body').addClass('map-page')
            }, 1000 );
        }
    }

    getCountryName( isoA2, lang = null ) {
        if ( !lang ) {
            lang = window.currentLang;
        }
        if ( lang == 'en' ) {
            return this.countriesDict[ isoA2 ].country;
        }
        if ( lang == 'he' ) {
            return this.countriesDict[ isoA2 ].hebrew;
        }
        if ( 'countriesNames' in window ) {
            for ( const country of window.countriesNames ) {
                if ( country.alpha2 == isoA2.toLowerCase() ) {
                    if ( lang in country ) {
                        return country[ lang ];
                    }
                }
            }    
        }
        return isoA2;
    }

    zoomCountry( isoA2 ) {
        if(isoA2 === 'PS') {
            isoA2 ='IL'
        }

        const countryInfo = this.countriesDict[ isoA2 ];
        const bounds = countryInfo.bounds;
        const map = this.map;

        $( 'body' ).addClass( 'show-country-name' );
        this.$mapCountryName.html( this.getCountryName( isoA2 ) );

        $('body').addClass('country-page');
        $('body').removeClass('map-page');
        map.setPaintProperty('water', 'fill-opacity', 0);
        map.setPaintProperty('landuse', 'fill-opacity', 0);
        map.setPaintProperty('land-structure-polygon', 'fill-opacity', 0);
        map.setPaintProperty('aeroway-polygon', 'fill-opacity', 0);
        map.setPaintProperty('building', 'fill-opacity', 0);
        map.setPaintProperty('national-park', 'fill-opacity', 0);
        map.setPaintProperty('waterway', 'line-opacity', 0);
        map.setPaintProperty('land', 'background-opacity', 0);
        map.setPaintProperty('admin-0-boundary', 'line-opacity', 0);
        map.setPaintProperty('admin-1-boundary', 'line-opacity', 0);
        map.setPaintProperty( "admin-0-boundary-disputed", 'line-opacity', 0);  
        map.setPaintProperty('cf', 'fill-color', '#F3ECEA');
        

        if (isoA2 === "IL" || isoA2 === "PS") {
            map.setPaintProperty('cf-outline', 'line-opacity', [
                'case',
                ['==', ['get', 'ISO_A2'], 'PS'],
                0.2,
                0 
            ]);
            map.setPaintProperty('cf', 'fill-opacity', [
                'case',
                ['==', ['get', 'ISO_A2'], 'IL'], 
                1,
                ['==', ['get', 'ISO_A2'], 'PS'], 
                1,
                0
            ]);
        } else {
            map.setPaintProperty('cf', 'fill-opacity', [
                'case',
                ['all', ['==', ['get', 'ISO_A2'], isoA2] ],
                1, 
                0  
            ]);

            map.setPaintProperty('cf-outline', 'line-opacity', [
                'case',
                ['==', ['get', 'ISO_A2'], isoA2],
                0,
                0 
            ]);
        }

        map.fitBounds( [
                [ bounds[0], bounds[1] ],
                [ bounds[2], bounds[3] ]
            ],
            {
                padding: 100,
                duration: 1000,
            }
        );

        map.scrollZoom.disable();
        map.dragPan.disable();
        this.disableEventsToggle = true;

        if ( 'tali' in window ) {
            window.tali.currentCountry = isoA2;

            window.tali.expandTimelines();
        }

    }

    startMap( data ) {
        const map = this.map;
        
        map.addSource( "cbs", {
            "type": "geojson",
            "data": data
        } );

        map.addLayer({
            "id": "cf",  
            "type": "fill",
            "source": "cbs",
            "layout": {},
            "paint": {
                "fill-color": "#F87A62",
                "fill-opacity": 0,
                'fill-color-transition': { duration: 1000 },
                'fill-opacity-transition': { duration: this.transitionDuration },
            }
        });

        map.addLayer({
            "id": "cf-outline",
            "type": "line",
            "source": "cbs",
            "layout": {},
            "paint": {
                "line-color": "#000000",
                "line-width": 2,  
                "line-opacity": 0,
            }
        });

        let lastISO_A2 = null;


        
        map.on('mousemove', e => {
            if (this.disableEventsToggle) return;
        
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['cf']
            });

            
        
            if (features.length) {
                var country = features[0];
                var isoA2 = country.properties.ISO_A2;
                if (isoA2 === 'PS' ) {
                    isoA2 = 'IL'
                }

                // console.log(isoA2)
                var countryInfo = this.countriesDict[isoA2];
                var eventsLength = countryInfo?.eventsCount ?? 0;
                

                $('.current-marker').removeClass('current-marker'); // Reset previously highlighted marker
                if (countryInfo?.marker) {
                    $(countryInfo.marker.getElement()).addClass('current-marker'); // Highlight current marker
                }
                
                if (countryInfo) {
                    if (isoA2 !== lastISO_A2) {
                        
                        $('body').removeClass('show-country-name');
                        this.$mapCountryName.html(this.getCountryName(isoA2));
        
                        if (eventsLength === 0) {
                            $('body').removeClass('show-country-name');
                            $('body').addClass('show-country-name-no-events');
                        } else {
                            $('body').removeClass('show-country-name-no-events');
                            $('body').addClass('show-country-name');
                        }
        
                        lastISO_A2 = isoA2;
                    }
                }
        
                map.setPaintProperty('cf', 'fill-opacity', [
                    'case',
                    ['all', ['==', ['get', 'ADMIN'], country.properties.ADMIN], ['!=', eventsLength, 0]],
                    1, 
                    0
                ]);
        
                if (isoA2 === "IL" || isoA2 === "PS") {
                    map.setPaintProperty('cf-outline', 'line-opacity', [
                        'case',
                        ['all', ['==', ['get', 'ISO_A2'], 'PS'], ['!=', eventsLength, 0]], 
                        1,
                        0 // Reset for others
                    ]);
                
                    map.setPaintProperty('cf', 'fill-opacity', [
                        'case',
                        ['all', ['==', ['get', 'ISO_A2'], 'IL'], ['!=', eventsLength, 0]], 
                        1,
                        ['all', ['==', ['get', 'ISO_A2'], 'PS'], ['!=', eventsLength, 0]], 
                        1,
                        0
                    ]);
                } else {
                    map.setPaintProperty('cf-outline', 'line-opacity', 0);    
                }
            } else {
                map.setPaintProperty('cf', 'fill-opacity', 0);
                map.setPaintProperty('cf-outline', 'line-opacity', 0);
                $('body').removeClass('show-country-name');
                $('body').removeClass('show-country-name-no-events');
                lastISO_A2 = null;
            }
        });
        

        map.on('click', e => {
            if (this.disableEventsToggle) return;
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['cf']
            });

            var country = features[0];
            var isoA2 = country.properties.ISO_A2;
            var countryInfo = this.countriesDict[isoA2];
            var eventsLength = countryInfo?.eventsCount ?? 0;

            if (eventsLength > 0 || (isoA2 === 'PS' && this.countriesDict['IL'].eventsCount > 0 )) {
                this.zoomCountry( features[ 0 ].properties.ISO_A2 );
                let yearParams = '';
                if ( 'tali' in window ) {
                    yearParams = `/from:${tali.fromYear}/to:${tali.toYear}`
                }    
                tali.saveState( "country-" + features[ 0 ].properties.ISO_A2.toLowerCase() );
                // history.replaceState( {}, null, window.mapUrl + "/" + features[ 0 ].properties.ISO_A2.toLowerCase() + yearParams )
            }
        });

        $( document ).on('click', '.country-close-btn', () => {
            
            if ( !$( 'body' ).hasClass( 'country-page' ) ) return;
            this.zoomOut();
            
            let yearParams = '';
            if ( 'tali' in window ) {
                yearParams = `/from:${tali.fromYear}/to:${tali.toYear}`
            }
            tali.saveState( "map" );
            // history.replaceState( {}, null, window.mapUrl + yearParams )
        });
        

        $( document ).on( "click", ".toggle-link.axis-link", e => {
            e.preventDefault();
            if($( "body" ).hasClass('country-page')){
                $( "body" ).removeClass( "map-page" ).removeClass( "country-page" ).removeClass( "show-country-name" ).addClass( "home-page" );
                // window.selfUrl = e.currentTarget.href.replace(/\/$/g, '');
                
                
                this.zoomOutMap();
                // setTimeout(()=>{
                    this.smallGlobe();
                    if ( 'tali' in window ) {
                        window.tali.currentCountry = null;
                        this.filterMarkers() ;
                        tali.arriveAllEvents();
                        tali.saveState( );
                    }
                // } ,500)
                
            } else {
                this.mapToTimeline(e)
            }   
        } );

        $( document ).on('click', ".map-to-timeline-link", e => {
            this.mapToTimeline(e)
        })

        $( document ).on( "click", ".go-to-map-link, .toggle-link.map-link", e => {
            e.preventDefault();
            // window.selfUrl = e.currentTarget.href.replace(/\/$/g, '');
            $( "body" ).removeClass( "home-page" ).addClass( "map-page" );
            this.bigGlobe();
            if ( 'tali' in window ) {
                tali.collapseTimelines();
                tali.saveState( "map" );
                // history.replaceState( {
                //     from: tali.fromYear,
                //     to: tali.toYear
                // }, null, selfUrl + `/from:${tali.fromYear}/to:${tali.toYear}` );
            }
        } );

        $('#zoom-in').on('click', function () {
            map.zoomIn(); // Zoom in the map
        });
        
        $('#zoom-out').on('click', function () {
            map.zoomOut(); // Zoom out the map
        });

        // NIR: this needs to go into popstate and adjust (i.e. change "this" to "taliMap")
        if ( $( "body" ).hasClass( "home-page" ) || $( "body" ).hasClass( "event-page" ) ) {
            this.quietSmallGlobe();
        } else if ( $( "body" ).hasClass( "country-page" ) && 'taliCountryCode' in window ) {
            this.zoomCountry( window.taliCountryCode.toUpperCase() );
        }

        $( "html" ).addClass( "map-loaded" );
        $( document ).trigger( "map-loaded" );
        
        this.showInstructions();

        $(document).on('click', () => {
            this.hideInstructions();
        })

        map.on('move', ()=> {
            this.hideInstructions();
        })
    }

    mapToTimeline(e) {
        e.preventDefault();
        $( "body" ).removeClass( "map-page" ).removeClass( "country-page" ).removeClass( "show-country-name" ).addClass( "home-page" );
        // window.selfUrl = e.currentTarget.href.replace(/\/$/g, '');
        this.smallGlobe();
        if ( 'tali' in window ) {
            // window.tali.currentCountry = null;
            tali.expandTimelines();
            tali.saveState( );
        }
    }

    quietSmallGlobe() {
        $( ".map-container" ).css( {
            opacity: 0,
            visibility: 'hidden'
        } );
        this.smallGlobe();
    }

    spinGlobe() {
        if ( this.spinEnabled ) {
            let distancePerSecond = 360 / this.secondsPerRevolution;
            const center = this.map.getCenter();
            center.lng -= distancePerSecond;
            this.map.easeTo({ center, duration: 1000, easing: (n) => n });
        }
    }

    spin() {
        this.spinEnabled = true;
        this.spinGlobe();
    }

    stopSpinning() {
        this.spinEnabled = false;
        this.map.stop();
    }
    
    showInstructions() {
        if ($('body').hasClass('map-page')) {
            // let visitCount = localStorage.getItem('visitCount');
    
            // if (!visitCount) {
            //     visitCount = 1;
            // } else {
            //     visitCount = parseInt(visitCount) + 1;
            // }
    
            // if (visitCount === 1 || visitCount % 4 === 0) {
                setTimeout(() => {
                    $('body').addClass('show-instructions');
                }, 250);
            // }
    
            // localStorage.setItem('visitCount', visitCount);
        }
    }

    hideInstructions() {
        if($('body').hasClass('map-page')) {
                $('body').removeClass('show-instructions')
            
        }
    }

    bigGlobe() {
        
        const map = this.map;

        this.stopSpinning();
        let anim = true;

        const req = () => {
            if ( anim ) {
                map.resize();
                requestAnimationFrame( req );
            }
        };

        map.setPaintProperty( "cf", "fill-color", "#F87A62" );
        map.setPaintProperty( "cf", "fill-opacity", 0 );

        setTimeout( () => {
            map.easeTo( {
                center: this.initialMapCenter,
                zoom: this.initialZoom,
                duration: 1000
            } );
        }, 1000 );

        setTimeout( () => {
            anim = false;
            this.disableEventsToggle = false;
            map.scrollZoom.enable();
            map.dragPan.enable();
            this.showInstructions();
        }, 2500 );

        // gsap.to( ".map-container", {
        //     left: 0,
        //     bottom: 0,
        //     width: "100vw",
        //     height: "100vh",
        //     scale: 1,
        //     transformOrigin: "left bottom",
        //     delay: 1,
        // } );

        gsap.to( ".map-container", {
            autoAlpha: 1,
            delay: .5
        } );

        requestAnimationFrame( req );

        
    }

    smallGlobe() {

        const map = this.map;
        let anim = true;
        const req = () => {
            if ( anim ) {
                map.resize();
                requestAnimationFrame( req );
            }
        };

        this.disableEventsToggle = true;
        map.scrollZoom.disable();
        map.dragPan.disable();

        map.setPaintProperty( "cf", "fill-color", "#000000" );
        map.setPaintProperty( "cf", "fill-opacity", 1 );

        map.easeTo({
            center: this.initialMapCenter,
            zoom: 0.15,
            duration: 1000
        });

        // setTimeout( () => {
        //     anim = false;
        //     this.spinEnabled = true;
        //     map.resize();
        //     this.spin();
        // }, 2500 );

        // gsap.to( ".map-container", {
        //     left: 24,
        //     bottom: 24,
        //     width: 200,
        //     height: 200,
        //     scale: 0.5,
        //     transformOrigin: "left bottom",
        //     // delay: 1,
        // } );

        gsap.to( ".map-container", {
            autoAlpha: 0,
            duration: .05,
            delay: .5
        } );

        requestAnimationFrame( req );

    }

    filterMarkers() {
        // If Tali isn't ready yet, keep the initial marker counts from init().
        if ( !( "tali" in window ) || !( "timelines" in tali ) ) return;

        const hasSearchInput =
            typeof tali.searchInput === "string" && tali.searchInput.trim() !== "";
        const hasActiveHeaderTagFilters =
            Array.isArray( tali.filters ) && tali.filters.length > 0;

        Object.keys( this.countriesDict ).forEach( key => {
            this.countriesDict[ key ].eventsCount = 0;
            $( this.countriesDict[ key ].marker?.getElement() ).addClass( "hidden" );
        } );
        for ( const tl of Object.values( tali.timelines ) ) {
            // When searching on the map page, exclude "אירועים בעולם" (global timeline)
            // from the per-country marker counts.
            if ( ( hasSearchInput || hasActiveHeaderTagFilters ) && tl?.isGlobal ) continue;
            for ( const ev of tl.getActiveObjects() ) {
                if ( ev?.type === "cluster" || !ev?.content || !( "country" in ev.content ) ) continue;

                // Count once per marker-country (merge PS into IL; avoid IL+PS double count).
                const markerCountryCodes = new Set(
                    ( ev.content.country || [] )
                        .map( c => ( c === "PS" ? "IL" : c ) )
                        .filter( Boolean )
                );

                for ( const countryCode of markerCountryCodes ) {
                    const countryInfo = this.countriesDict[ countryCode ];
                    if ( !countryInfo ) continue;

                    countryInfo.eventsCount += 1;

                    const $markerEl = $( countryInfo.marker?.getElement() );
                    $markerEl.removeClass( "hidden" );
                    $markerEl.find( ".map-marker-number" ).html( countryInfo.eventsCount );
                }
            }
        }
    }


    
    
}

$( function() {
    window.taliMap = new TaliMap( historicEventsMap.events, countriesDict, countriesGeoJsonDataUrl );
    if ( $( "body" ).hasClass( "home-page" ) ) {
        $( document ).on( "timelines-expanded", () => {
            window.taliMap.init();
        } );
    } else {
        window.taliMap.init();
    }

    if ( 'lottie' in window ) {
        lottie.loadAnimation({
            container: document.getElementById('scrollLottie'),
            renderer: 'svg', 
            loop: true,
            autoplay: true, 
            path: scrollLottie
        });
        
        lottie.loadAnimation({
            container: document.getElementById('dragLottie'),
            renderer: 'svg', 
            loop: true,
            autoplay: true, 
            path: dragLottie
        });    
    }

    
    
} );

