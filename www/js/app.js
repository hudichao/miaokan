// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js


//mySeed默认装 geolocation camera socialSharing inappbrowser network
//参考ngCordova
//cordova plugin add org.apache.cordova.geolocation废弃
//cordova plugin add org.apache.cordova.camera废弃
//cordova plugin add org.apache.cordova.network-information废弃

//cordova plugin add cordova-plugin-geolocation
//cordova plugin add cordova-plugin-camera
//cordova plugin add cordova-plugin-network-information
//cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git


//为了上传文件，安装file-transfer
//cordova plugin add cordova-plugin-file-transfer

//crosswalk
//ionic browser add crosswalk


//http://www.changeself.net/archives/ionic%EF%BC%9Apublishing-your-app.html
//http://rensanning.iteye.com/blog/2205322
//http://rensanning.iteye.com/blog/2030516
//http://ionicframework.com/docs/guide/publishing.html

//cordova plugin add cordova-plugin-x-toast

angular.module('starter', ['ionic', 'ksSwiper', 'pasvaz.bindonce', 'monospaced.elastic', 'ngCordova', 'starter.controllers', 'starter.services', 'starter.directives', 'ngIOS9UIWebViewPatch'])

.constant('SERVER_URL', 'http://115.29.195.14:8080/')
// .constant('SERVER_URL', 'http://192.168.50.103:8888/miaokan')
.constant('PIC_UPLOAD_URL', 'http://115.29.195.14:10001/image')
.run(['$ionicPlatform', function($ionicPlatform) {
  $ionicPlatform.ready(function() {

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      //console.log(StatusBar);
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }


    //放这里会导致appCtrl里$rootScope.debugOnBrowser是undefined
    //$rootScope.debugOnBrowser = !ionic.Platform.isWebView();//webview说明在cordova里

  });
}])
.run(['$rootScope', '$q', '$cordovaNetwork', 'Utils', '$ionicPopup', '$timeout', '$cordovaSplashscreen', 'Geolocation', 'TopicCacheFactory', 'Photo', '$ionicPlatform', 'User', function ($rootScope, $q, $cordovaNetwork, Utils, $ionicPopup, $timeout, $cordovaSplashscreen, Geolocation, TopicCacheFactory, Photo, $ionicPlatform, User) {
  //console.log(JSON.stringify(window.localStorage));
  //console.log(navigator.splashscreen);


  // var type = $cordovaNetwork.getNetwork();
  // //console.log(type);
  
  //---start读取位置
  var Browser = function() {
    return {
      getUser: function() {
        $rootScope.user_id = 'debug-test'; 
        return $q.when($rootScope.user_id);
      },
      getLocation: function() {
        $rootScope.myLocation = {lat:30.24083417420134, lng:120.0290236902183};
        return $q.when({lat:30.24083417420134, lng: 120.0290236902183});    
      },
      openCamera: function() {
        return $q.when({photoSize: "未知", previewURL: "./img/1.jpg"});
      },
      savePhoto: function() {
        return $q.when("http://7xn8nc.com1.z0.glb.clouddn.com/XBhE9l5CQfhf0VHvYs9Q");
      }
    };
  };
  var App = function() {
    return {
      getUser: function() {
        //$rootScope.user_id = device.uuid;; 
        $rootScope.user_id = ionic.Platform.isWebView() ? device.uuid : 'debug-test'; 
        return $q.when($rootScope.user_id);
      },
      getLocation: function() {
        var d = $q.defer();

        console.log('get Location');
        Geolocation.getPosition().then(function(pos) {
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          $rootScope.myLocation = {lat:lat, lng:lng};
          d.resolve({lat:lat,lng:lng});
        }, function(err) {
          if (err.code === 1) {
            //说明被拒绝了
            //d.reject("读取地理位置失败");
            d.reject("喵看需要打开地理位置~");
          }
          if (err.code === 2) {
            //d.reject("读取地理位置失败");
            d.reject("读取地理位置失败");
          }
          if (err.code === 3) {
            //超时
            //d.reject("读取地理位置失败");
            d.reject("获取地理位置超时~");

          }
        });

        return d.promise;
      },
      openCamera: function() {
        var d = $q.defer();

        Photo.take()
        .then(function(fileURI) {
          //get file size 
          window.resolveLocalFileSystemURL(fileURI, function(fileEntry) {
            fileEntry.file(function(fileObj) {
              var photoSize = (fileObj.size / 1000).toFixed(2) + 'kb';
              d.resolve({photoSize: photoSize, previewURL: fileURI});
            });
          });
        });

        return d.promise;
      },
      savePhoto: function(local_pic_url) {
        var d = $q.defer();

        Photo.upload(local_pic_url)
        .then(function(result) {
          console.log(result);
          var response = JSON.parse(result.response);

          if (response.issuccess === 'success') {
            d.resolve(response.res);
          } else {
            d.reject("图片上传出错，请稍候再试");
          }
        }, function(err) {
          console.log(err);
        });
        return d.promise;
      },
      getLocationNameOnce: function(location) {
        var d = $q.defer();

        Utils.getPositionName(location.lat, location.lng, 1)
        .then(function(result) {
          $rootScope.myLocationName = result;
          d.resolve(result);
        }, function(err) {
          d.reject(err);
        });

        return d.promise;
      }
    };
  };

  var Action = function() {
    var debugOnBrowser = !ionic.Platform.isWebView();//webview说明在cordova里
    //var debugOnBrowser = false;
    if (debugOnBrowser) {
      return Browser();
    } else {
      return App();
    }
  };

  $rootScope.getUser = Action().getUser;
  $rootScope.getLocation = Action().getLocation;
  $rootScope.openCamera = Action().openCamera;
  $rootScope.getLocationNameOnce = App().getLocationNameOnce;
  $rootScope.savePhoto = Action().savePhoto;

  $rootScope.getLocationName = function(location) {
    var counter = arguments[1] || 0;
    console.log(counter);
    var tryTime = 1;
    counter++;

    if (counter > tryTime) {
      return;
    }

    $rootScope.getLocationNameOnce(location).
    then(function(loationName){
      console.log("获取地理位置名称成功");
      console.log(loationName);
    }, function() {
      console.log("获取地理位置名称失败，第" + counter +'次尝试');
      $rootScope.getLocationName(location, counter);
    });
  };
  

  var goaway = function() {

  };

  $rootScope.checkNewVersion = function() {
    if (window.localStorage.version2_didTutorial === 'true') {


      window.localStorage.version = 3;
      

      if (window.Connection) {

        if (navigator.connection.type === 'wifi') {
          if (Math.random() > 0) {
            Utils.getVersion()
            .then(function(data) {
              if (parseInt(data, 10) > parseInt(window.localStorage.version, 10)) {
                //console.log('has new version');
                var popUp = $ionicPopup.confirm({
                  title: '更新',
                  template: 'miao~喵看新版本发布中~',
                  cancelText: '取消',
                  okText: '更新',
                  okType: 'myHokokuAndDeleteBtn',
                  cancelType: 'myCancelBtn'
                });
                popUp.then(function(res){
                  if (res) {
                    window.open('http://www.miaokanapp.com?from=version3','_system','location=yes');
                  }
                });
              }
            });
          }
        }
      }
    }
  };
  
  var goback = function() {
    
    
  };


  $ionicPlatform.ready(function() {
    document.addEventListener('pause', goaway, false);
    document.addEventListener('resume', goback, false);
  });

 
}])
.config(['$ionicConfigProvider', function ($ionicConfigProvider) {

  $ionicConfigProvider.views.maxCache(10);
  $ionicConfigProvider.views.transition('ios');

  //下面这个会iOS下导致键盘与滚动的bug
  //$ionicConfigProvider.scrolling.jsScrolling(false);

  //所以将使用限定在android

  if (ionic.Platform.isWebView() &&ionic.Platform.isAndroid()) {
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $ionicConfigProvider.views.transition('none');
  } 


  $ionicConfigProvider.backButton.previousTitleText(false);
  $ionicConfigProvider.backButton.text('');

  $ionicConfigProvider.spinner.icon("bubbles");

  $ionicConfigProvider.tabs.style("standard");
  $ionicConfigProvider.tabs.position("bottom");

  $ionicConfigProvider.navBar.alignTitle("center");
  //for ios
  $ionicConfigProvider.views.swipeBackEnabled(false);


}])
.config(['$stateProvider', '$urlRouterProvider', '$logProvider', '$compileProvider', function($stateProvider, $urlRouterProvider, $logProvider, $compileProvider) {


  var isDebugging = false;

  (function(){
    $logProvider.debugEnabled(isDebugging);
    $compileProvider.debugInfoEnabled(isDebugging);
  })(isDebugging);

  $stateProvider
  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })
  .state('intro', {
    url: '/intro',

    templateUrl: 'templates/intro.html',
    controller: 'IntroCtrl'

  })
  .state('app.topics', {
    url: '/topics',
    views: {
      'main': {
        templateUrl: 'templates/topics.html',
        controller: 'TopicsCtrl'
      }
    }
  })
  .state('app.comments', {
    url: '/comments',
    params: {
      topic_id: undefined,
      initial_slide: 0
    },
    views: {
      'main': {
        templateUrl: 'templates/comments.html',
        controller: 'CommentsCtrl'
      }
    }
  })
  .state('app.sub', {
    url: '/sub',
    views: {
      'main': {
        templateUrl: 'templates/sub.html',
        controller: 'SubCtrl'
      }
    }
  });

  if (window.localStorage.version2_didTutorial === 'true') {
    //$urlRouterProvider.otherwise('/tutorial'); 
    $urlRouterProvider.otherwise('/app/topics');
  }else{

    $urlRouterProvider.otherwise('/intro');     
  }



}]);
