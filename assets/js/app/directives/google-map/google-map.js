(function(ng) {
    ng.module('app').directive('googleMap', [
        '$q',
        '$log',
        '$rootScope',
        'utility.googleMaps',
        'utility.geoLocation',
        function($q, $log, $rootScope, googleMaps, geoLocation) {
            var DEFAULT_LOCATION = {
                latitude: 44.81666699999994,
                longitude: 20.46666700000003
            };
            var CIRCLE_WIDTH_RATIO = 2 * 1.5;

            googleMaps.catch(function() {
                $log.error('Google Maps API v3 not loaded!');
            });

            return {
                restrict: 'E',
                scope: {
                    place: '='
                },
                templateUrl: '/assets/js/app/directives/google-map/view.html',
                link: function(scope, element, attrs) {
                    var map = null;
                    var markers = [];
                    var mapZoom = 14;
                    var handler = null;
                    var location = null;
                    var mapSearch = null;
                    var searchInput = attrs.searchSelector ? element[0].parentNode.querySelector(attrs.searchSelector) : element[0].querySelector('.map-search');

                    // Show hidden input if selector not provided
                    searchInput.type = 'text';

                    scope.mapReady = false;

                    googleMaps.then(function(google) {
                        var mapSettings = {
                            zoom: mapZoom,
                            scrollwheel: false,
                            center: new google.maps.LatLng(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude),
                            mapTypeId: google.maps.MapTypeId.ROADMAP,
                            disableDefaultUI: true
                        };

                        map = new google.maps.Map(element[0].querySelector('.map-canvas'), mapSettings);
                        mapSearch = new google.maps.places.SearchBox(searchInput);

                        google.maps.event.addListener(map, 'bounds_changed', function() {
                            var me = this;
                            calculateMapRadius().then(function(height) {
                                mapSearch.setBounds(map.getBounds());
                                updateMapCoordinates(me.getCenter().lat(), me.getCenter().lng(), height);
                            });
                        });

                        google.maps.event.addListener(map, 'dragend', function() {
                            var me = this;
                            calculateMapRadius().then(function(height) {
                                updateMapCoordinates(me.getCenter().lat(), me.getCenter().lng(), height);
                            });
                        });

                        google.maps.event.addListener(mapSearch, 'places_changed', function() {
                            var places = mapSearch.getPlaces();
                            var bounds = null;

                            if (places.length == 0) {
                                return;
                            }

                            ng.forEach(markers, function(marker) {
                                marker.setMap(null);
                            });

                            // For each place, get the icon, place name, and location.
                            markers = [];
                            bounds = new google.maps.LatLngBounds();

                            ng.forEach(places, function(place) {
                                var image = {
                                    url: place.icon,
                                    size: new google.maps.Size(71, 71),
                                    origin: new google.maps.Point(0, 0),
                                    anchor: new google.maps.Point(17, 34),
                                    scaledSize: new google.maps.Size(25, 25)
                                };

                                // Create a marker for each place.
                                markers.push(new google.maps.Marker({
                                    map: map,
                                    icon: image,
                                    title: place.name,
                                    position: place.geometry.location
                                }));

                                bounds.extend(place.geometry.location);
                            });

                            map.fitBounds(bounds);

                            calculateMapRadius().then(function(height) {
                                mapZoom = map.getZoom();
                                updateMapCoordinates(map.getCenter().lat(), map.getCenter().lng(), height);
                            });
                        });

                        scope.mapReady = true;
                    });

                    if (attrs.setLocation) {
                        setGeoLocation();
                    }

                    function updateMapCoordinates(latitude, longitude, radius) {
                        scope.place.radius = radius;
                        scope.place.center.latitude = latitude;
                        scope.place.center.longitude = longitude;

                        $rootScope.$$phase || scope.$apply();
                    }

                    function calculateMapRadius() {
                        var deferred = $q.defer();

                        googleMaps.then(function(google) {
                            if (map) {
                                var spherical = google.maps.geometry.spherical;
                                var bounds = map.getBounds();
                                var cor1 = bounds.getNorthEast();
                                var cor2 = bounds.getSouthWest();
                                //  var cor3 = new google.maps.LatLng(cor2.lat(), cor1.lng());
                                var cor4 = new google.maps.LatLng(cor1.lat(), cor2.lng());
                                //  var width = spherical.computeDistanceBetween(cor1, cor3);
                                var height = spherical.computeDistanceBetween(cor1, cor4);

                                deferred.resolve(height / CIRCLE_WIDTH_RATIO);
                            } else {
                                deferred.reject('Map not instantiated!');
                            }
                        });

                        return deferred.promise;
                    }

                    function setGeoLocation() {
                        var deferred = $q.defer();

                        googleMaps.then(function(google) {
                            if (map) {
                                geoLocation.getLocation()
                                    .then(function(result) {
                                        location = result;
                                        map.setCenter(new google.maps.LatLng(result.coords.latitude, result.coords.longitude), mapZoom);
                                        deferred.resolve();
                                    })
                                    .catch(function() {
                                        deferred.reject('Geo location not available!');
                                    });
                            } else {
                                deferred.reject('Map not instantiated!');
                            }
                        });

                        return deferred.promise;
                    }

                    scope.zoomIn = function() {
                        if (map) {
                            map.setZoom(mapZoom + 1);
                            mapZoom = map.getZoom();
                        }
                    };

                    scope.zoomOut = function() {
                        if (map) {
                            map.setZoom(mapZoom - 1);
                            mapZoom = map.getZoom();
                        }
                    };

                    scope.$watch('place', function(newValue, oldValue) {
                        if (!ng.equals(newValue, oldValue)) {
                            googleMaps.then(function(google) {
                                if (map) {
                                    map.setCenter(new google.maps.LatLng(newValue.center.latitude, newValue.center.longitude), mapZoom);
                                }
                            });
                        }
                    }, true);

                    handler = $rootScope.$on('places.map:set_geo_location', function() {
                        setGeoLocation();
                    });

                    $rootScope.$on('places.map:set_bounds', function(event, data) {
                        map.fitBounds(data.bounds);
                        
                        google.maps.event.addListenerOnce(map, 'idle', function() {
                            mapZoom = map.getZoom();
                        });
                    });

                    scope.$on('$destroy', function() {
                        if (handler) {
                            handler();
                        }
                        googleMaps.then(function(google) {
                            if (map) {
                                google.maps.event.clearListeners(map, 'bounds_changed');
                                google.maps.event.clearListeners(map, 'places_changed');
                                google.maps.event.clearListeners(map, 'dragend');
                            }
                        });
                    });
                }
            };
        }
    ]);
}(window.angular));
