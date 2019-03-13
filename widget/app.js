'use strict';

(function (angular, buildfire, window) {

  angular.module('seminarNotesPluginWidget', ['infinite-scroll', 'ngRoute', 'ui.bootstrap', 'ngTouch', 'ngAnimate'])
    .config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {

      /**
       * To make href urls safe on mobile
       */
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|cdvfile|file):/);


    }])
    .directive("viewSwitcher", ["ViewStack", "$rootScope", '$compile', "$templateCache",
      function (ViewStack, $rootScope, $compile, $templateCache) {
        return {
          restrict: 'AE',
          link: function (scope, elem, attrs) {
            var views = 0,
              currentView = null;
            manageDisplay();
            $rootScope.$on('VIEW_CHANGED', function (e, type, view, noAnimation) {
              if (type === 'PUSH') {
                console.log("VIEW_CHANGED>>>>>>>>", type, view);
                currentView = ViewStack.getPreviousView();

                var newScope = $rootScope.$new();
                var _newView = '<div  id="' + view.template + '" ><div class="slide content" data-back-img="{{itemDetailbackgroundImage}}" ng-include="\'templates/' + view.template + '.html\'"></div></div>';
                var parTpl = $compile(_newView)(newScope);

                $(elem).append(parTpl);
                views++;

              } else if (type === 'POP') {

                var _elToRemove = $(elem).find('#' + view.template),
                  _child = _elToRemove.children("div").eq(0);

                _child.addClass("ng-leave ng-leave-active");
                _child.one("webkitTransitionEnd transitionend oTransitionEnd", function (e) {
                  _elToRemove.remove();
                  views--;
                });

                currentView = ViewStack.getCurrentView();
              }
              else if (type === 'POPALL') {
                console.log(view);
                angular.forEach(view, function (value, key) {
                  var _elToRemove = $(elem).find('#' + value.template),
                    _child = _elToRemove.children("div").eq(0);

                  if (!noAnimation) {
                    _child.addClass("ng-leave ng-leave-active");
                    _child.one("webkitTransitionEnd transitionend oTransitionEnd", function (e) {
                      _elToRemove.remove();
                      views--;
                    });
                  } else {
                    _elToRemove.remove();
                    views--;
                  }
                });
              }
              manageDisplay();
            });

            function manageDisplay() {
              if (views) {
                $(elem).removeClass("ng-hide");
              } else {
                $(elem).addClass("ng-hide");
              }
            }

          }
        };
      }])
    .directive("buildFireCarousel", ["$rootScope", function ($rootScope) {
      return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
          $rootScope.$broadcast("Carousel:LOADED");
        }
      };
    }])
    .directive("buildFireCarousel2", ["$rootScope", function ($rootScope) {
      return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
          $rootScope.$broadcast("Carousel2:LOADED");
        }
      };
    }])
    .directive("loadImage", ['Buildfire', function (Buildfire) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          element.attr("src", "../../../styles/media/holder-" + attrs.loadImage + ".gif");

            var _img = attrs.finalSrc;
            if (attrs.cropType == 'resize') {
                Buildfire.imageLib.local.resizeImage(_img, {
                    width: attrs.cropWidth,
                    height: attrs.cropHeight
                }, function (err, imgUrl) {
                    _img = imgUrl;
                    replaceImg(_img);
                });
            } else {
                Buildfire.imageLib.local.cropImage(_img, {
                    width: attrs.cropWidth,
                    height: attrs.cropHeight
                }, function (err, imgUrl) {
                    _img = imgUrl;
                    replaceImg(_img);
                });
            }

            function replaceImg(finalSrc) {
                var elem = $("<img>");
                elem[0].onload = function () {
                    element.attr("src", finalSrc);
                    elem.remove();
                };
                elem.attr("src", finalSrc);
            }
        }
      };
    }])
    .run(['ViewStack', '$rootScope', function (ViewStack, $rootScope) {
      window.$(document).on('touchstart', 'textarea', function (e) {
        if (document.activeElement === e.target) {
          setTimeout(function () {
            window.focus();
          }, 150);
        }
      });
      buildfire.navigation.onBackButtonClick = function () {
        if (ViewStack.hasViews()) {
          if (ViewStack.getCurrentView().template == 'Item') {
            buildfire.messaging.sendMessageToControl({
              type: 'BackToHome'
            });
          }
          ViewStack.pop();
        } else {
          buildfire.navigation._goBackOne();
        }
      };

      buildfire.messaging.onReceivedMessage = function (msg) {
        switch (msg.type) {
          case 'AddNewItem':
            ViewStack.popAllViews(true);
            ViewStack.push({
              template: 'Item',
              params: {
                itemId: msg.id,
                stopSwitch: true
              }
            });
            $rootScope.$apply();

            break;
          case 'OpenItem':
            var currentView = ViewStack.getCurrentView();
            if (currentView && currentView.template !== "Item") {
              // ViewStack.popAllViews(true);
              ViewStack.push({
                template: 'Item',
                params: {
                  itemId: msg.id
                }
              });
              $rootScope.$apply();
            }
            break;
          default:
            ViewStack.popAllViews(true);

        }
      };

    }])
    .directive('backImg', ["$rootScope", function ($rootScope) {
      return function (scope, element, attrs) {
        attrs.$observe('backImg', function (value) {
          var img = '';
          if (value) {
            buildfire.imageLib.local.cropImage(value, {
              width: $rootScope.deviceWidth,
              height: $rootScope.deviceHeight
            }, function (err, imgUrl) {
              if (imgUrl) {
                img = imgUrl;
                element.attr("style", 'background:url(' + img + ') !important ;background-size: cover !important;');
              } else {
                img = '';
                element.attr("style", 'background-color:white');
              }
              element.css({
                'background-size': 'cover !important'
              });
            });
            // img = $filter("cropImage")(value, $rootScope.deviceWidth, $rootScope.deviceHeight, true);
          }
          else {
            img = "";
            element.attr("style", 'background-color:white');
            element.css({
              'background-size': 'cover !important'
            });
          }
        });
      };
    }])
    .directive("disableAnimate", function ($animate) {
      return function (scope, element) {
        $animate.enabled(false, element);
      };
    });
})(window.angular, window.buildfire, window);
