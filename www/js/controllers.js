angular.module('starter.controllers', [])
.controller('AppCtrl', ['$scope', '$rootScope', 'Geolocation', '$ionicPopup', '$q', 'Utils', 'User', '$timeout', function ($scope, $rootScope, Geolocation, $ionicPopup, $q, Utils, User, $timeout) {
  ionic.Platform.ready(function() {
    $rootScope.getUser().then(function(data) {

      // $.ajaxSetup({
      //   headers: {"APPUUID": $rootScope.uuid}
      // });
    
      User.create(data);
    });

    //试试git 分支

    $rootScope.checkNewVersion();

    var timeout = $timeout(function() {
      $rootScope.getLocation()
      .then(function(location) {
        var timeout2 = $timeout(function() {
          $rootScope.getLocationName(location);
          $timeout.cancel(timeout2);
        });
      });
      $timeout.cancel(timeout);
    },2000);
  });

  //显示statusbar
  if(window.StatusBar) {
    StatusBar.show();
  }

}])
.controller('CommentsCtrl', ['$scope', '$rootScope','$timeout', 'Photo', 'Geolocation', '$q', 'Utils', '$ionicPopup','$ionicModal', 'Topics','$state','TopicCacheFactory','Comments','$stateParams', '$ionicActionSheet','Report',
  function ($scope, $rootScope, $timeout, Photo, Geolocation, $q, Utils, $ionicPopup, $ionicModal, Topics, $state, TopicCacheFactory, Comments, $stateParams, $ionicActionSheet, Report) {
  $scope.topics = TopicCacheFactory.get();
  $scope.activeTopic = $stateParams.topic_id;
  console.log('active topic id :', $scope.activeTopic);
  $scope.initialSlide = $stateParams.initial_slide;
  $scope.comments = {};

  // $scope.comments[$scope.activeTopic] = [1,2,3,4,5,6,7,8,9];
  //---get comments starts
  getComments($scope.activeTopic);
  //ends

  //---init swiper
  $scope.swiper = {};

  $scope.onReadySwiper = function(swiper) {
    swiper.on('slideChangeStart', function() {
      //console.log('slide start');
      //console.log('active topic id:', $scope.activeTopic);
      $scope.activeTopic = $scope.topics[swiper.activeIndex].id;

      getComments($scope.activeTopic);
    });

    swiper.on('onSlideChangeEnd', function() {
      //console.log('slide end');
    });
  };
  //ends


  //start输入框
  $scope.inputData = {};

  var isIOS=ionic.Platform.isWebView() && ionic.Platform.isIOS();
  //console.log('is ios?', isIOS);
  //for 送信 
  $scope.createComment = function(){

    //console.log($scope.inputData);
    if ($scope.inputData.comment === undefined || $scope.inputData.comment.match(/^\s*$/)){
      var myPopup2 = $ionicPopup.show({
        title: '写些啥呢',
        scope: $scope
      });
      var timeout = $timeout(function() {
        myPopup2.close();
        $timeout.cancel(timeout);
      }, 1000);

      //console.log('写些啥呢 ');
      return;
    } else if ($scope.inputData.comment.length > 100) {
      //console.log('too long');
      return;
    }
    var data = {
      body: $scope.inputData.comment,
      user_id: $scope.user_id,
      topic_id: $scope.activeTopic,
      myLocation: $rootScope.myLocation,
      ifBlocked: false,
    };
    //本来是新的在最上面
    //$scope.comments[$scope.activeTopic].unshift({body:$scope.inputData.comment});
    
    //现在是新的在最下面
    $scope.comments[$scope.activeTopic].push({body:$scope.inputData.comment});

    Comments.create(data)
    .then(function() {
      //console.log("create comments");
    });
     
    var timeout2 = $timeout(function() {
      delete $scope.inputData.comment;
      $timeout.cancel(timeout2);
    },100);

  };

  var orderByScore = function(a,b) {
    //easy version,only look created_time
    //decsending(meaning new one come first)
    return b.created_time - a.created_time;
  };

  function getComments(topic_id) {
    //如果已经有值，不再读取数据库
    console.log($scope.comments[topic_id]);
    if ($scope.comments[topic_id]) {
      //console.log($scope.comments[topic_id]);
      $scope.$apply();
    } else {
      console.log(topic_id);
      Comments.CommentsOfThisTopic($scope.activeTopic)
      .then(function(data) {
        $scope.comments[topic_id] = data;
      });
    }

  }

  //for 送信end

  //----for elastic textarea start
  var footerBar;
  var scroller;

  $scope.$on('$ionicView.enter', function(){
    var timeout = $timeout(function() {
      footerBar = document.body.querySelector('#comments_page .bar-footer');
      scroller = document.body.querySelector('#comments_page .scroll-content');
    }, 100);
  });

  $scope.$on('elastic:resize', function(e, ta) {
    //console.log('resized!');
    //console.log(ta);
    //console.log(JSON.stringify(ta));
    var taHeight = ta[0].offsetHeight;
    //console.log(taHeight);
    //console.log(footerBar);

    ////console.log(taHeight);
    if (!footerBar) return;

    var newFooterHeight = taHeight + 10;
    newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;

    //var newFooterHeight = taHeight + 16;//因为上下padding各4
    //newFooterHeight = (newFooterHeight > 50) ? newFooterHeight : 50;
    footerBar.style.height = newFooterHeight + 'px';
    scroller.style.bottom = newFooterHeight + 'px'; 

    // for iOS you will need to add the keyboardHeight to the scroller.style.bottom
     if (isIOS) {
       //console.log(newFooterHeight + keyboardHeight + 'px');
       scroller.style.bottom = newFooterHeight + keyboardHeight + 'px'; 
     } else {
       scroller.style.bottom = newFooterHeight + 'px'; 
     }

  });
  //ends

  $scope.jubao = function() {
    var author = $rootScope.user_id;
    var topics_id = $scope.activeTopic;

    var actionSheet1 = $ionicActionSheet.show({
      buttons:[
        {text:'举报'}
      ],
      buttonClicked:function(index) {
        if (index === 0) {
          var reportPopup=$ionicPopup.confirm({
            title: '举报',
            template: '这条喵看很黄很暴力，确认举报',
            cancelText: '取消',
            okText: '确定',
            okType: 'myHokokuAndDeleteBtn',
            cancelType: 'myCancelBtn'
          });
          reportPopup.then(function(res){
            if(res){

              Report.topic(topics_id, author).then(function() {
                //console.log("report complete");
              });

              var reportPopup = $ionicPopup.show({
                title:'感谢您的举报。',
                scope: $scope
              });

              var timeout = $timeout(function(){
                reportPopup.close();
                $timeout.cancel(timeout);
              },2000);

              //console.log('report to act');
            }else{
              //console.log('report cancel');
            }
          });
          return true;
        }
      }
    });
  };
}])
.controller('TopicsCtrl', ['$scope', '$rootScope','$timeout', 'Photo', 'Geolocation', '$q', 'Utils', '$ionicPopup','$ionicModal', 'Topics','$state','TopicCacheFactory', '$ionicLoading', function ($scope, $rootScope, $timeout, Photo, Geolocation, $q, Utils, $ionicPopup, $ionicModal, Topics, $state, TopicCacheFactory, $ionicLoading) {
  //---for show page starts
  var onShowToast = function(event, data) {
    var position = data.position;
    var msg = data.msg;
    var duration = data.duration;

    var timeout = $timeout(function() {

      window.plugins.toast.showWithOptions(
        {
          message: msg,
          duration: duration,
          position: position,
          addPixelsY: 40  // added a negative value to move it up a bit (default 0)
        });

      $timeout.cancel(timeout);
    });
  };

  $scope.$on("showToast",onShowToast);


  //orderByScore not used
  var orderByScore = function(a,b){
    //easy version,only look created_time
    //decsending(meaning new one come first)
    return b.created_time-a.created_time;
  };

  var plusTimeCommentNumberLocalURI = function(topics){
    if (!topics) {
      return;
    }

    angular.forEach(topics,function(value,key){
      //show_time
      var show_time = Utils.convert_time(value.dateCreate);
      value.show_time = show_time;

      //comment_number
      if (value.commentNumber === 0 || value.commentNumber === null) {
        value.commentNumber = "";
      } else {
        value.commentNumber = value.commentNumber + '回复';
      }
      value.local_pic_url = value.pictureUrl;
    });  
    return topics;
  };

  function getTopics() {
    return Topics.getTopics($rootScope.myLocation)
    .then(function(data) {
      if (data.length === 0) {
        $scope.noTopicNear = true;
      } else {
        $scope.noTopicNear = false;
      }

      var d = $q.defer();

      var timeout = $timeout(function() {
        $scope.topics = plusTimeCommentNumberLocalURI(data);
        d.resolve($scope.topics);
        $timeout.cancel(timeout);
      });
      return d.promise;
    }, function(err) {
      //console.log(err);
      return d.promise;
    });
  }

  function init() {
    $scope.isLoading = true;
    var d = $q.defer();

    console.time('get location');
    $rootScope.getLocation()
    .then(function(location) {
      console.log($scope.myLocation);
      $timeout(function() {
        $rootScope.getLocationName(location);
      });
      console.timeEnd('get location');
      console.time('get data');

      getTopics().then(function(data) {
        console.timeEnd('get data');
        TopicCacheFactory.set(data);
        d.resolve();
        //$ionicLoading.hide();
      }, function(err) {
        d.reject();
      })
      .finally(function() {
        $scope.isLoading = false;
      });
    }, function(err) {

      $scope.$emit("showToast", {msg:err, position: "top", duration: "short"});
      //不再用ionic
      // var popUp = $ionicPopup.alert({
      //   //template: '使用喵看需要打开地理定位<br><br>前往「设置」→「隐私」→「定位服务」，打开喵看。',
      //   template: err,
      //   buttons: [
      //     {text:'OK',type:'myHokokuAndDeleteBtn'},
      // ]});
      $scope.isLoading = false;
      d.reject();
    });
    return d.promise;
  }

  // var loading = $ionicLoading.show({
  //   delay:2000,
  //   duration:10000,
  //   noBackdrop:true,
  //   template:"<ion-spinner icon='bubbles'/></ion-spinner>"
  // })
  $scope.topics = [];
  $rootScope.cachedTopics = TopicCacheFactory.get(); 
  $scope.topics = $rootScope.cachedTopics || []; 

  if ($scope.topics.length === 0) {
    $scope.isLoading  = true;
    $scope.needInit = true;
  } else {
    $scope.isLoading  = false;
    $scope.needInit = false;

  }

  ionic.Platform.ready(function() {
    $scope.deviceReady = true;
    if ($scope.needInit) {
      init();
    }
  });
  


  $scope.doRefresh = function() {
    init()
    .then(function() {
      TopicCacheFactory.set($scope.topics);
    })
    .finally(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.noMoreItemsAvailable = true;

  // $scope.loadMore = function() {
  //   var nowLength = $scope.topics.length;
  //   //console.log($scope.topics);
  //   $scope.topics = $scope.topics.concat();
  //   //console.log($scope.topics);
  //   //console.log(nowLength);
  //   //console.log($scope.allTopics.length);
  //   if (nowLength === $scope.allTopics.length) {
  //     $scope.noMoreItemsAvailable = true;
  //   }
  // }

  $scope.goToTopicPage = function(topic, index) {
    //console.log('go to topic page');
    //TopicCacheFactory.cacheTopics($scope.topics);
    $state.go("app.comments", {topic_id: topic.id, initial_slide: index});
  };

  //ends

  //拍照按钮

  $scope.takePhoto = function() {

    $rootScope.openCamera()
    .then(function(obj) {
      $scope.previewURL = obj.previewURL;
      $scope.photoSize = obj.photoSize;

      $scope.openModal();

      var timeout = $timeout(function() {
        // cordova.plugins.Keyboard.show();
        $rootScope.getLocation()
        .then(function(location) {
          $rootScope.getLocationName(location);
        });

        $timeout.cancel(timeout);
      }, 400);
    }, function(err) {
      console.log(err);
    });
  };


  //---for modal open starts

  $ionicModal.fromTemplateUrl('templates/modal_addTopic.html',
    {
      scope: $scope,
      focusFirstInput: true,
      backdropClickToClose: false

    })
  .then(function(modal) {
      $scope.modal = modal;
  });
  
  $scope.$on('$destroy', function(){
    $scope.modal.remove();
  });

  $scope.openModal = function() {
    $scope.newTopic = {};
    $scope.canSubmit = true;
    $scope.isSubmitting = false;

    $scope.modal.show();

  };

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.closeNewTopic = function(){
    $scope.newTopic = {};

    $scope.modal.hide();
  };

  $scope.updateIfCanSubmit = function(a_topic) {

    if (a_topic === undefined){
      //$scope.canSubmit = false;
    } else if (a_topic.body === undefined || a_topic.body.match(/^\s*$/)) {
      //$scope.canSubmit = false;
    } else if(a_topic.body.length > 100){
      $scope.canSubmit = false;
    } else{
      $scope.canSubmit=true;
    }
  };

  $scope.createTopic = function(a_topic) {
    //console.log('create topic');
    //console.log('canSubmit? ', $scope.canSubmit);
    //console.log('isSubmitting? ', $scope.isSubmitting);

    if ($scope.canSubmit === false || $scope.isSubmitting === true){
      return;
    }

    $scope.isSubmitting = true;

    var user_id = $scope.user_id;
    var defaultPlaceholder = "";
    var body = a_topic.body || defaultPlaceholder;
    var myLocation = $rootScope.myLocation;
    var local_pic_url = $scope.previewURL;
    var myLocationName = $rootScope.myLocationName;

    var data = {
      user_id: user_id,
      body: body,
      myLocation: myLocation,
      pic_url: "",
      myLocationName: myLocationName
    };


    var myPopup = $ionicPopup.show({
      title: '发送中',
      scope: $scope
    });
    var timeout = $timeout(function() {
      myPopup.close();
      $timeout.cancel(timeout);
      $scope.closeNewTopic();
      $scope.$emit("showToast",{position: "top", duration: "long", msg: "发送成功，下拉刷新可查看最新内容"});
    }, 1000);


    console.log(data);
    $rootScope.savePhoto(local_pic_url)
    .then(function(imgUrl) {
      //upload topic itself
      data.pic_url = imgUrl;
      console.log(data);
      Topics.create(data)
      .then(function() {
        console.log('topics created!!!!');

      });

    }, function(err) {
      // console.log(err);

      // myPopup.close();

      // var myPopup2 = $ionicPopup.show({
      //   title: err,
      //   scope: $scope
      // });

      // var timeout = $timeout(function() {
      //   myPopup2.close();
      //   $timeout.cancel(timeout);
      // }, 1000);

    }, function(progress) {

    })
    .finally(function() {
      $scope.isSubmitting = false;
    });
  };

}])
.controller('IntroCtrl', ['Device', '$timeout', '$ionicModal', '$rootScope', '$scope', '$state', '$ionicSlideBoxDelegate', function (Device, $timeout, $ionicModal, $rootScope, $scope, $state, $ionicSlideBoxDelegate) {


  $scope.startApp = function(){
    window.localStorage.version2_didTutorial = 'true';
    $rootScope.didTutorial = true;
    $state.go('app.topics');
  };

  ionic.Platform.ready(function(){
    if(window.StatusBar) {
      StatusBar.hide();
    }
    if(window.device){
      $scope.model = device.model;
    }
    //$scope.model=device.model;
    var deviceList = Device.list();
    ////// //console.log(deviceList);
    $scope.version = deviceList[$scope.model];

    if ($scope.version === undefined &&
       $scope.version !== '4' &&
       $scope.version !== '4s' &&
       $scope.version !== '5s' &&
       $scope.version !== '6' &&
       $scope.version !== '6+'
      ) {
      $scope.version = '5s';
    }
    // $scope.version='6+';
    var tmp1 = ['4page1.jpg', '4page2.jpg', '4page3.jpg', '4page4.jpg', '4page5.jpg'];
    var tmp2 = ['6+page1.jpg', '6+page2.jpg', '6+page3.jpg', '6+page4.jpg', '6+page5.jpg'];

    // $scope.images = {
    //   '4': ['4sintro1.png', '4sintro2.png', '4sintro3.png', '4sintro4.png', '4sintro5.png'],
    //   '4s': ['4sintro1.png', '4sintro2.png', '4sintro3.png', '4sintro4.png', '4sintro5.png'],
    //   '5s': ['5sintro1.png', '5sintro2.png', '5sintro3.png', '5sintro4.png', '5sintro5.png'],
    //   '6': ['5sintro1.png', '5sintro2.png', '5sintro3.png', '5sintro4.png', '5sintro5.png'],
    //   '6+': ['5sintro1.png', '5sintro2.png', '5sintro3.png', '5sintro4.png', '5sintro5.png'],
    // }

    $scope.images = {
      '4': tmp1,
      '4s': tmp1,
      '5s': tmp2,
      '6': tmp2,
      '6+': tmp2
    };

    $scope.image = $scope.images[$scope.version];

    ////// //console.log($scope.image)

  });
  
  $scope.next = function(){
    $ionicSlideBoxDelegate.next();
  };

  $scope.previous = function(){
    $ionicSlideBoxDelegate.previous();
  };

  //called each time when the slide changes
  $scope.slideChanged = function(index){
    $scope.slideIndex = index;
  };

  $ionicModal.fromTemplateUrl('templates/modal_user_privacy.html',{
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.showModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  $scope.$on('$destroy',function() {
    $scope.modal.remove();
  });

  $ionicModal.fromTemplateUrl('templates/modal_privacy_policy.html',{
    scope: $scope
  }).then(function(modal) {
    $scope.modal2 = modal;
  });
  $scope.showModal2 = function(){
    $scope.modal2.show();
  };
  $scope.closeModal2 = function(){
    $scope.modal2.hide();
  };

  $scope.$on('destroy',function(){
    $scope.modal2.remove();
  });

}]);
