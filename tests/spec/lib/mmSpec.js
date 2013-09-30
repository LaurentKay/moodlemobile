describe("MM", function() {

    function resetMM() {
        // Values on the MM object
        config = {};
        plugins = [];
        models = {};
        collections = {};
        deviceType = 'phone';
        clickType = 'click';
        quickClick = 'click';
        deviceReady = false;
        deviceOS = '';
        logData = [];
        inComputer = false;
        touchMoving = false;
        scrollType = '';
        mq = 'only screen and (min-width = 768px) and (-webkit-min-device-pixel-ratio = 1)';

        if (MM.backup !== undefined) {
            // Bolt-ons to the MM object
            MM.util = _.clone(MM.backup.util);
            MM.lang = _.clone(MM.backup.lang);
            MM.mq = _.clone(MM.backup.mq);
            MM.config = _.clone(MM.backup.config);
        } else {
            MM.backup = {};
        }
    }

    beforeEach(function() {
        resetMM();

        var config = {
            'hello' : 'world'
        };
        var lang = JSON.stringify({
            'astring':'some phrase to return'
        });
        MM.init(config);
        MM.lang.base = JSON.parse(lang);
        MM.backup.util = _.clone(MM.util);
        MM.backup.lang = _.clone(MM.lang);
        MM.backup.mq = _.clone(MM.mq);
        MM.backup.config = _.clone(MM.config);
    });

    describe("init", function() {
        describe("MM.config has been set", function() {
            it("has the correct config", function() {
                expect(MM.config).toEqual({'hello':'world'});
            });
        });
        describe("sets correct event type", function() {
            // mock MM.util.isTouchDevice to return true
            // test MM.clickType = 'touchend'
            // test MM.quickClick = 'touchstart'
            it("when we have a touch device", function() {
                MM.util.isTouchDevice = spyOn(MM.util, "isTouchDevice").andReturn(true);
                MM.init({});
                expect(MM.util.isTouchDevice).toHaveBeenCalled();
                expect(MM.clickType).toEqual('touchend');
                expect(MM.quickClick).toEqual('touchstart');
            });

            // mock MM.util.isTouchDevice to return false
            // test MM.clickType = 'click'
            // test MM.quickClick = 'click'
            it("when we don't have a touch device", function() {
                spyOn(MM.util, "isTouchDevice").andReturn(false);
                MM.init({});
                expect(MM.util.isTouchDevice).toHaveBeenCalled();
                expect(MM.clickType).toEqual('click');
                expect(MM.quickClick).toEqual('click');
            });

        });

        describe("calls setDeviceType", function() {
            it("Sets the device to a tablet", function() {
                var matchMediaResponse = {
                    matches: true
                };
                MM.mq = {'hello':'world'};
                spyOn(window, "matchMedia").andReturn(matchMediaResponse);
                MM.init({});
                expect(window.matchMedia).toHaveBeenCalledWith({'hello':'world'});
                expect(MM.deviceType).toEqual('tablet');
                expect($("body").hasClass('tablet')).toEqual(true);
            });

            it("Sets the device to a phone", function() {
                var matchMediaResponse = {
                    matches: false
                };                
                MM.mq = {'hello':'world'};
                spyOn(window, "matchMedia").andReturn(matchMediaResponse);
                MM.init({});
                expect(window.matchMedia).toHaveBeenCalledWith({'hello':'world'});
                expect(MM.deviceType).toEqual('phone');
                expect($("body").hasClass('phone')).toEqual(true);
            });
        });

        describe("calls setDeviceOS", function() {
            // Mock navigator.userAgent to be the string iPhone
            // test this.deviceOS is ios
            it("sets OS to ios when iPhone in userAgent", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 iphone abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('ios');
            });

            // Mock navigator.userAgent to be the string iPad
            // test this.deviceOS is ios
            it("sets OS to ios when iPad in userAgent", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 ipad abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('ios');
            });            

            // Mock navigator.userAgent to be the string Android
            // test this.deviceOS is android
            it("sets OS to android when Android in userAgent", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 android abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('android');
            });            

            // Mock navigator.userAgent to be the string foo
            // test this.deviceOS is 'null'
            it("sets OS to null when garbage in userAgent", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 some other user agent abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('null');
            });            

            // Mock navigator.userAgent to be the string iPhone Android
            // test this.deviceOS is ios
            it("sets OS to ios when userAgent is contains both iPhone and Android", function() {
                spyOn(MM, "_getUserAgent").andReturn("12345 android iphone abcdef");
                MM.init({});
                expect(MM.deviceOS).toEqual('ios');
            });            
        });

        it("calls loadBackboneRouter", function() {
            var myBackboneRouter = function() {
                var obj = {};
                obj.route = function() {};
                obj.name = 'An anonymous router';
                return obj;
            };
            spyOn(Backbone.Router, 'extend').andReturn(myBackboneRouter);
            MM.init({});
            expect(Backbone.Router.extend).toHaveBeenCalled();
            expect(MM.Router.name).toEqual("An anonymous router");
            // Mock Backbone.Router.extend to return a fake object
            // test this.Router is an instance of the fake object
        });

        it("sets ajax defaults", function() {
            spyOn($, 'ajaxSetup').andCallThrough();
            MM.init({});
            expect($.ajaxSetup).toHaveBeenCalled();
        });

        it("loads core models", function() {
            var modelsArray = [
                'setting','site','course','user','cacheEl','syncEl'
            ];
            var collectionsArray = [
                'settings', 'sites', 'courses', 'users', 'cache', 'sync'
            ];
            MM.init({});
            expect(_.keys(MM.models)).toEqual(modelsArray);
            expect(_.keys(MM.collections)).toEqual(collectionsArray);
        });

        it("loads routes", function() {
            // We use our Router for this test.
            var myBackboneRouter = function() {
                var obj = {};
                obj.route = function(a, b, c) {};
                obj.name = 'An anonymous router';
                return obj;
            };

            // We don't want the Router doing anything in the background
            // so use our harmless one.            
            spyOn(Backbone.Router, 'extend').andReturn(myBackboneRouter);

            MM.util.helpMeLogin = 'Help Me Login Text';

            MM.settings = {
                'display' : 'Settings display',
                'showSection': 'Settings show Section',
                'showSite':'Settings show site',
                'addSite':'Settings add site',
                'deleteSite':'Settings delete site'
            };

            MM.cache = {
                'purge' : 'Purge Cache Function'
            };

            MM.refresh = 'Some refresh function';
            MM.showLog = 'Some logging function';

            var MMSyncLangFunction = function() {
                MM.lang.sync(true);
            };

            var MMSyncCSSFunction = function() {
                MM.sync.css(true);
            };

            MM.init({});

            // Overwrite the currently instantiated Router
            MM.Router = new myBackboneRouter();

            // Set the spy on our new router
            spyOn(MM.Router, 'route').andCallThrough();

            // Recall the function we need to test.
            MM.loadRoutes();

            expect(MM.Router.route).toHaveBeenCalledSequentiallyWith(
                [
                    ['helpmelogin', 'helpmelogin', "Help Me Login Text"],
                    ['settings', 'settings', 'Settings display'],
                    ['refresh', 'refresh', 'Some refresh function'],
                    ['settings/:section/', 'settings_section', 'Settings show Section'],
                    ['settings/sites/:siteid', 'settings_sites_show_site', 'Settings show site'],
                    ['settings/sites/add', 'settings_sites_add_site', 'Settings add site'],
                    ['settings/sites/delete/:siteid', 'settings_sites_delete_site', 'Settings delete site'],
                    ['settings/general/purgecaches', 'settings_general_purgecaches', 'Purge Cache Function'],
                    ['settings/sync/lang', 'settings_sync_lang', MMSyncLangFunction],
                    ['settings/sync/css', 'settings_sync_css', MMSyncCSSFunction],
                    ['settings/development/log/:filter', 'settings_sync_css', 'Some logging function']
                ]
            );
            expect(MM.Router.route.callCount).toBe(11);
        });
    });

    describe("deviceConnected", function() {
        it("reports state correctly when connected", function() {
            var myTestNetwork = {
                connection: {
                    type: 'testnetwork type'
                }
            };

            window.Connection = {
                'NONE':'no connection',
                'UNKNOWN':'unknown connection'
            };

            // Mock network states and test connection is reported correctly 
            spyOn(MM, 'deviceConnected').andCallThrough();
            spyOn(MM, '_getNetwork').andCallFake(function() {
                return myTestNetwork;
            });
            spyOn(MM, 'getConfig').andCallFake(function() {
                return;
            });
            spyOn(MM, 'log').andCallThrough();
            MM.init({});
            var result = MM.deviceConnected();
            expect(MM.deviceConnected).toHaveBeenCalled();
            expect(result).toEqual(true);
            expect(MM.log).toHaveBeenCalledSequentiallyWith(
                [
                    ['Initializating app'],
                    ['Internet connection checked ' + true]
                ]
            );            
        });

        it("reports state correctly when disconnected", function() {
            // Required by the test.
            $(document.body).append(
                $("<div>").attr('id', 'main-wrapper').css('display', 'block')
            );

            // Mock network states and test connection is reported correctly 
            spyOn(MM, 'deviceConnected').andCallThrough();
            spyOn(MM, '_getNetwork').andCallFake(function() {
                return;
            });
            spyOn(MM, 'getConfig').andCallFake(function() {
                return true;
            });
            spyOn(MM, 'log').andCallThrough();
            MM.init({});
            var result = MM.deviceConnected();
            expect(MM.deviceConnected).toHaveBeenCalled();
            expect(result).toEqual(false);
            expect(MM.log).toHaveBeenCalledSequentiallyWith(
                [
                    ['Initializating app'],
                    ['Returning not connected (forced by settings)']
                ]
            );

            // Remove the DOM element
            $("#main-wrapper").remove();
        });
    });
/*
    describe("loadLayout", function() {
        it("starts backbone history", function() {
        });

        it("adds event handlers", function() {
        });

        it("displays the page", function() {
        });

        it("calls MM.loadExtraJs", function() {
        });

        it("handles orientation changes", function() {
            // Mock various heights & widths, test calculations
        });

        it("handles media query changes", function() {
            // Mock various MQs, test that the page is reloaded accordingly
        });

        it("sets tablet or phone layout appropriately", function() {
            // Mock device type, test correct layout function is called
        });

        it("sets correct scrolling type", function() {
            // Mock device types, test correct scrolling setup function is called
        });
    });

    describe("loadSite", function() {
        it("calls MM.sync.init", function() {
        });

        it("calls setUpConfig", function() {
        });

        it("calls setUpLanguages", function() {
        });
        
        it("calls loadCachedRemoteCSS", function() {
        });

        describe("setUpConfig", function() {
            it("calls setConfig for current_site and current_token", function() {
            });
        });

        describe("setUpLanguages", function() {
            it ("calls MM.lang.setup for each plugin", function() {
            });

            it("calls MM.lang.sync", function() {
            });
        });

        describe("loadCachedRemoteCSS", function() {
            it("sets CSS URL appropriately", function() {
                // Mock cache element, test that CSS URL is set accordingly.
            });

            it("calls MM.lang.sync", function() {
            });
        });
    });

    describe("addSite", function() {
        it("calls MM.saveSite if input is valid", function() {
        });

        it("doesn't call MM.saveSite if input is invalid", function() {
        });
    });

    describe("saveSite", function() {
        it("handles successful login attempts", function() {
        });

        it("handles unsuccessful login attempts", function() {
        });
    });

    describe("registerPlugin", function() {
        it("adds the plugin to this.plugins", function() {
        });

        it("adds the plugin's routes to the router", function() {
        });

        it("calls loadModels", function() {
        });

        it("calls MM.lang.loadPluginLang", function() {
        });

        it("calls MM.sync.registerHook if plugin.sync is defined", function() {
        });
    });

    describe("loadModels", function() {
        it("sets this.models for objects of type model", function() {
        });
        
        it("sets this.collections for objects of type collection", function() {
        });
        
        it("sets obj.bbproperties", function() {
        }); 
    });

    describe("moodleWSCall", function() {
        it("calls addOperationToQueue when device is offline", function() {
        });

        it("calls getDataFromCache when presets.cache is set", function() {
        });

        it("handles successful webservice calls", function() {
        });

        it("handles unsuccessful webservice calls", function() {
        });

        describe("addOperationToQueue", function() {
            it("adds the operation to the queue", function() {
            });

        });

        describe("getDataFromCache", function() {
            it("gets data from the cache", function() {
            });
        });
    });

    describe("moodleUploadFile", function() {
        it("calls ft.upload", function() {
        });

        it("handles disconnections", function() {
        });

        it("handles successful uploads", function() {
        });

        it("handles unsuccessful uploads", function() {
        });
    });

    describe("moodleDownloadFile", function() {
        it("handles successful downloads", function() {
        });

        it("handles unsuccessful downloads", function() {
        });
    });

    describe("wsSync", function() {
        it("logs a warning if sync process is disabled", function() {
        });

        it("exits cleanly if sync process is disabled", function() {
        });

        it("exits cleanly if device is not connected", function() {
        });

        it("calls the correct sync function for the given type", function() {
        });

        describe("wsSyncWebService", function() {
            it("makes a web service call", function() {
            });

            describe("when the web service call is successful", function() {
                it("adds an entry to the log", function() {
                });

                it("removes the sync object from the database", function() {
                });
            });

            describe("when the web service call is unsuccessful", function() {
                it("exits silently", function() {
                });
            });
        });

        describe("wsSyncUpload", function() {
            it("creates a FileTransfer object", function() {
            });

            it("calls the FileTransfer object's upload method with the appropriate args", function() {
            });

            describe("when the upload is successful", function() {
                it("adds an entry to the log", function() {
                });

                it("removes the sync object from the database", function() {
                });
            });

            describe("when the upload is unsuccessful", function() {
                it("adds an entry to the log", function() {
                });
            });
        });

        describe("wsSyncDownload", function() {
            it("exits cleanly if the sync objects site is not the current site", function() {
            });

            it("creates a directory for the download", function() {
            });

            it("calls moodleDownloadFile", function() {
            });

            describe("when the download is successful", function() {
                it("adds an entry to the log", function() {
                });

                it("stores the content in the database", function() {
                });

                it("removes the sync object from the database", function() {
                });
            });

            describe("when the download is unsuccessful", function() {
                it("adds an entry to the log", function() {
                });
            });
        });
    });

    describe("displaySettings", function() {
        it("shows the panel", function() {
        });

        it("includes all plugins", function() {
        });
    });

    describe("getConfig", function() {
        it("returns the setting if available", function() {
        });

        it("returns the default value if the setting isn't available", function() {
        });

        it("returns a site-specific settings if the site argument is passed", function() {
        }); 
    });

    describe("setConfig", function() {
        it("adds the setting to the database", function() {
        });

        it("adds a site-specific setting if the site argument is passed", function() {
        });
    });

    describe("fixPluginFile", function() {
        it("adds the tonken to the URL", function() {
        });
        
        it("removes the webservice part of the URL", function() {
        });
    });

    describe("log", function() {
        it("exits cleanly if the dev_debug setting is not set", function() {
        });

        it("logs against the 'Core' component if no component is specified", function() {
        });

        it("it logs to the console if window.console is available", function() {
        });

        it("removes the last entry from MM.logData if the length is too long", function() {
        });
    });

    describe("getFormattedLog", function() {
        it("exits cleanly if the dev_debug setting is not set", function() {
        });

        it("returns the contents of MM.logData", function() {
        });
    });

    describe("showLog", function() {
        it("puts the log info in the right panel", function() {
        });

        it("recursively calls itself when a filter is entered", function() {
        });
    });

    describe("popErrorMessage", function() {
        it("resets routing", function() {
        });

        it("calls this.popMessage with the passed message", function() {
        });
    });

    describe("popMessage", function() {
        it("calls MM.widgets.dialog with the appropriate args", function() {
        });
    });

    describe("popConfirm", function() {
        it("calls popMessage with the appropriate args", function() {
        });
    });

    describe("handleExternalLinks", function() {
        it("calls MM.setExternalLinksHREF with the given selector", function() {
        });

        it("binds the click handler", function() {
        });


        describe("setExternalLinksHREF", function() {
            it("exits cleanly if MM.clickType is not 'click'", function() {
            });

            it("binds the click/touchstart handler", function() {
            });

            describe("when the click/touchstart event fires", function() {
                it("resets the routing", function() {
                });

                it("sets the link attributes", function() {
                });
            });
        });

        describe("externalLinkClickHandler", function() {
            it("calls preventDefault", function() {
            });

            describe("when touchMoving", function() {
                it("sets touchMoving to false", function() {
                });

                it("exits cleanly", function() {
                });
            });

            describe("when not touchMoving", function() {
                it("opens the link", function() {
                    // This will need expanding upon somewhat
                });
            });
        });
    });

    describe("handleFiles", function() {
        it("calls MM.setFileLinksHREF with the given selector", function() {
        });

        it("binds the click handler", function() {
        });


        describe("setFileLinksHREF", function() {
            it("exits cleanly if MM.clickType is not 'click'", function() {
            });

            it("binds the click/touchstart handler", function() {
            });

            describe("when the click/touchstart event fires", function() {
                it("resets the routing", function() {
                });

                it("sets the link attributes", function() {
                });
            });
        });

        describe("fileLinkClickHandler", function() {
            it("calls preventDefault", function() {
            });

            describe("when touchMoving", function() {
                it("sets touchMoving to false", function() {
                });

                it("exits cleanly", function() {
                });
            });

            describe("when not touchMoving", function() {
                it("opens the link", function() {
                    // This will need expanding upon somewhat
                });
            });
        });
    });

    describe("loadExtraJs", function() {
        it("exits cleanly if the device is not connected", function() {
        });

        it("loads the etra JS specified in the config", function() {
        });
    });

    describe("getOS", function() {
        it("returns the device platform in lower case", function() {
        });
    });
    
    describe("showModalLoading", function() {
        it("calls MM.widgets.dialog with the passed title & text", function() {
        });
    });

    describe("closeModalLoading", function() {
        it("calls MM.widgets.dialogCLose", function() {
        });
    });

    describe("refresh", function() {
        it("resets the routing", function() {
        });

        it("purges the cache", function() {
        });

        it("reloads the site", function() {
        });
    });
*/    
});
