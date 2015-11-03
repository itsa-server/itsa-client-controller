'use strict';

var isNode = (typeof global!=='undefined') && ({}.toString.call(global)==='[object global]') && (!global.document || ({}.toString.call(global.document)!=='[object HTMLDocument]')),
      NOOP = function() {},
      WINDOW = isNode ? {
         document: {
             head: {
                 appendChild: NOOP
             },
             createElement: NOOP
         }
      } : window;

var React = require('react'),
      DOCUMENT = WINDOW.document,
      HEAD = DOCUMENT.head,
      async = require('utils').async,
      Classes = require('itsa-classes');

var Controller = Classes.createClass(function() {
        var instance = this,
              exports = WINDOW.__itsa_react_server;
        if (exports) {
            instance.BodyComponent = exports.BodyComponent;
            instance.props = exports.props;
            instance.view = exports.props.__view;
            instance.lang = exports.props.__lang;

            // set moduleId of the chunk
            exports.props.__routes.some(function(route) {
                if (route.view===instance.view) {
                    instance.componentId = route.componentId;
                    instance.requireId = route.requireId;
                }
                return instance.componentId;
            });

            instance.staticView = exports.props.__staticView;
            delete WINDOW.__itsa_react_server;
            instance._initCss();
            instance._reRender();
        }
    },
    {

        _initCss: function() {
            var stylenode;
            // If the css was set through a `link`-element, we transfer it into a `style` element.
            // this way, we can manage its content
            var instance = this;
            instance.linkNode = DOCUMENT.querySelector('link[data-src="inline"]');
            if (instance.linkNode) {
                stylenode = DOCUMENT.querySelector('style[data-src="inline"]');
            }
            if (instance.linkNode || !stylenode) {
                stylenode = DOCUMENT.createElement('style');
                stylenode.setAttribute('data-src', 'inline');
                HEAD.appendChild(stylenode);
                instance._CssNode = stylenode;
                // cannot set instance.css --> will need to be loaded and set with next `setPage`
            }
            else {
                instance.css = stylenode.textContent;
            }
            instance._CssNode = stylenode;
        },

        _renderCss: function() {
            var instance = this;
            if (instance.css) {
                if (instance.linkNode) {
                    HEAD.removeChild(instance.linkNode);
                    delete instance.linkNode;
                }
                instance._CssNode.textContent = instance.css;
            }
        },

        getComponentId: function() {
            return this.componentId;
        },

        getRequireId: function() {
            return this.requireId;
        },

        _markHeadAttr: function() {
            HEAD.setAttribute('data-page', this.getView());
        },

        getProps: function() {
            return this.props;
        },

        getView: function() {
            return this.view;
        },

        getLang: function() {
            return this.lang;
        },

        isStaticView: function() {
            return this.staticView;
        },

        getTitle: function() {
            return DOCUMENT.title;
        },

        getBodyComponent: function() {
            return this.BodyComponent;
        },

        getCss: function() {
            return this._CssNode.textContent;
        },

        setPage: function(config/* view, BodyComponent, title, props, css, staticView, componentId, requireId */) {
            var instance = this;
            DOCUMENT.title = config.title || '';
            instance.BodyComponent = config.BodyComponent;
            instance.props = config.props || {};
            // specify lang AFTER props (because of the fallback)
            instance.lang = config.lang || instance.lang || instance.props.__lang;
            instance.css = config.css || '';
            instance.view = config.view;
            instance.componentId = config.componentId;
            instance.requireId = config.requireId;
            instance.staticView = (typeof config.staticView==='boolean') ? config.staticView : false;
            return instance._reRender();
        },

        _reRender: function() {
            var instance = this;
            return new Promise(function(resolve) {
                instance._markHeadAttr();
                instance._renderCss();
                // ff has issues when rendering comes immediate after setting new css.
                // therefore we go async:
                async(function() {
                    React.render(React.createElement(instance.BodyComponent, instance.props), DOCUMENT.body);
                    resolve();
                });
            });
        }
    });

if (!WINDOW.__ITSA_CLIENT_CONTROLLER) {
    WINDOW.__ITSA_CLIENT_CONTROLLER = isNode ? {} : new Controller();
}

module.exports = WINDOW.__ITSA_CLIENT_CONTROLLER;