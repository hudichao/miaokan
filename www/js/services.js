angular.module('starter.services', [])
.factory('Photo', ['$q','$cordovaCamera', '$cordovaFileTransfer', '$cordovaFile', 'PIC_UPLOAD_URL', function ($q, $cordovaCamera, $cordovaFileTransfer, cordovaFile, PIC_UPLOAD_URL) {
  
  //when take photo doTakeAction
  //order: take -> upload 

  //when get photo url doGetAction
  //order: 1) checkKeyMap -> 2) (YES?) readLocalFile (NO?) download -> updateKeyMap -> back to 2)
  var returnObj = {
    take: function() {
      var options = {
        quality: 75,
        //destinationType: Camera.DestinationType.DATA_URL,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA,
        allowEdit: false,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 600,
        targetHeight: 600,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false,
        correctOrientation:true
      };
      return $cordovaCamera.getPicture(options);

    },

    upload: function(localFileURI) {
      ////console.log("local file path is, " + localFileURI);
      //线上图片上传位置
      var isLocalTest = false;
      var url;
      var options = {};
      
      //本机上传位置
      if (isLocalTest) {
        //url = "http://192.168.50.102:1337/file/upload";
        url = PIC_UPLOAD_URL;

        options = {
          //fileKey: "avatar",
          //fileName: "image.jpg",
          //chunkedMode: false,
          mimeType: "image/jpg"
        };
      } else {
        url = PIC_UPLOAD_URL;
      }

      return $cordovaFileTransfer.upload(url, localFileURI, options);
    },

    download: function(url){

      var name = url.substr(url.lastIndexOf("/") + 1);
      var path = cordova.file.dataDirectory;
      var targetPath = path + name;
      //console.log("save to path: ", targetPath);
      var trustHosts = true;
      var options = {};

      return $cordovaFileTransfer.download(url, targetPath, options, trustHosts);
   

    }
  };

  return returnObj;
 

}])
.factory('TopicCacheFactory', [function () {
  var cachedTopics;

  return {
    set: function(topics) {
      if (topics) {
        window.localStorage.cachedTopics = JSON.stringify(topics);
  
        cachedTopics = JSON.stringify(topics);
      }
    },
    get: function() {
      if (cachedTopics) {
        return JSON.parse(cachedTopics);
      }
      cachedTopics = window.localStorage.cachedTopics;
      if (cachedTopics) {
        return JSON.parse(cachedTopics);
      } else {
        return [];
      }
    },

  };
}])
.factory('Topics', ['$q', 'SERVER_URL', function ($q, SERVER_URL) {  

  var returnObj = {
    getTopics: function(myLocation) {
      console.log('xxxx' + myLocation);
      var d = $q.defer();
      $.ajax({
        url: SERVER_URL + "/topic/queryWithRange",
        data: {
          locationLng: myLocation.lng,
          locationLat: myLocation.lat,
        },
        dataType: "json",
        type: "POST"
      })
      .then(function(res) {
        if (res.code === 200) {
          d.resolve(res.data);
        } else {
          d.reject();
        }
      });
      return d.promise;
    },
    get: function(topic_id){

    },
    delete: function(topic_id){

    },
    create: function(data){
      //console.log(JSON.stringify(data));

      var locationLat = data.myLocation.lat;
      var locationLng = data.myLocation.lng;
      var author = data.user_id;
      var body = data.body;
      var pictureUrl = data.pic_url;
      var locationName = data.myLocationName;

      var d = $q.defer();

      $.ajax({
        url: SERVER_URL + 'topic/create',
        type: 'POST',
        data: {
          author: author,
          body: body,
          pictureUrl: pictureUrl,
          locationLat: locationLat,
          locationLng: locationLng,
          locationName: locationName
        },
        dataType: "json"
      })
      .then(function(res) {
        console.log(res);
        if (res.code === 200) {
          d.resolve(res.data);
        } else {
          d.reject("发帖失败");
        }
      });
      return d.promise;
    }

  };
  return returnObj;
}])
.factory('Comments',['SERVER_URL', '$q', function(SERVER_URL, $q){
  
  return {
    CommentsOfThisTopic : function(topic_id) {
      var d = $q.defer();
      console.log(topic_id);
      console.log(SERVER_URL);
      $.ajax({
        url: SERVER_URL + '/comment/query/topic/' + topic_id,
        type: "GET",
        dataType: "json"
      })
      .then(function(res) {
        if (res.code === 200) {
          d.resolve(res.data.items);
        } else {
          d.reject();
        }
      });
      return d.promise;
    },
    create: function(data){
      var body = data.body;
      var author = data.user_id;
      var topicId = data.topic_id;
      var locationLng = data.myLocation.lng;
      var locationLat = data.myLocation.lat;

      var d = $q.defer();

      $.ajax({
        url: SERVER_URL + '/comment/create',
        dataType: 'json',
        type: "post",
        data: {
          topicId: topicId,
          author: author,
          body: body,
          locationLng: locationLng,
          locationLat: locationLat
        }
      })
      .then(function(res) {
        console.log(res);
        if (res.code === 200) {
          d.resolve(res.data);
        } else {
          d.reject();
        }
      });
      return d.promise;
    },
    delete:function(comment_id){

    }
  };
}])
.factory('Geolocation',['$q', function($q){
  var options={
    enableHighAccurarcy:false,
    timeout:10000,
    maximumAge:0
  };

  return {
    getPosition:function(){
      var d=$q.defer();

      //浙大
      //var position = {lat:30.30715, lng: 120.092765, coord_type:3};//baidu
      navigator.geolocation.getCurrentPosition(
        function(pos){
          d.resolve(pos);
        },
        function(err){
          d.reject(err);
        },
        options
        );

      return d.promise;
    },
    
  } ;
}])
.factory('Utils', ['$q', function ($q) {

  return {
    getVersion: function() {
      var d = $q.defer();
      $.ajax({
        url: "http://115.29.195.14:10002/version",
      })
      .then(function(res) {
        d.resolve(res);
      });
      return d.promise;
    },
    getPositionName: function(lat, lng, coord_type) {
      var d = $q.defer();
      // d.resolve("test");
      $.ajax({
        url: "http://apis.map.qq.com/ws/geocoder/v1",
        type: "get",
        data: {
          location: lat + ',' + lng,
          coord_type: coord_type || 1 ,//GPS坐标
          key: "WZGBZ-33YHU-EPJVP-2LTDL-VWBC2-A7FUO",
          get_poi: 1
        },
        dataType: "json"
      })
      .then(function(res) {
        if (res.status === 0) {
          //成功
          var pois = res.result.pois;
          // angular.forEach(pois, function(value, key) {
          //   if (value.category === '大学') {
          //      d.resolve(value.title);
          //   } 
          // })
          d.resolve(pois[0].title);
        } else {
          d.reject();
        }
      });

      return d.promise;
    },
    convert_time:function(time){
      var now_date=new Date();
      var now_time=now_date.getTime();
      var passed_time=now_time-time;
      var show_time;
      if(passed_time<1000*60){
        //less than 1 minute
        show_time="刚刚";
      }
      else if(passed_time<1000*60*60){
        //less than 1 hour
        show_time=Math.round(passed_time/1000/60)+'分钟前';
      }
      else if(passed_time<1000*60*60*24){
        //less than 1 day
        show_time=Math.round(passed_time/1000/60/60)+'小时前';
      }
      else{
        //more than 1 day
        show_time=Math.round(passed_time/1000/60/60/24)+'天前';
      }
      return show_time;
    },
  };
}])

.factory('User', ['SERVER_URL','$q', function (SERVER_URL, $q) {

  return {
    create: function(uuid) {
      var d = $q.defer();
      $.ajax({
        url: SERVER_URL + '/user/create',
        data: {
          uuid: uuid
        },
        dataType: "json",
        type: "POST"
      })
      .then(function(data) {
        console.log(data);
        if (data.code === 200) {
          d.resolve();
        }
      });
      return d.promise;
    }

  };
}])
.factory('Device',[function(){
  "http://theiphonewiki.com/wiki/index.php?title=Models";

  return {

    list: function(){
      return {
      'iPhone1,1':'4',
      'iPhone1,2':'4',
      'iPhone2,1':'4',
      'iPhone3,1':'4s',
      'iPhone3,2':'4s',
      'iPhone3,3':'4s',
      'iPhone4,1':'4s',
      'iPhone5,1':'5s',
      'iPhone5,2':'5s',
      'iPhone5,3':'5s',
      'iPhone6,1':'5s',
      'iPhone6,2':'5s',
      'iPhone7,2':'6',
      'iPhone8,1':'6',
      'iPhone7,1':'6+',
      'iPhone8,2':'6+',
      'iPod1,1':'4',
      'iPod2,1':'4',
      'iPod3,1':'4',
      'iPod4,1':'4s',
      'iPod5,1':'5s',
      'iPod7,1':'5s'
    };
  }
};
}])
.factory('Report', ['SERVER_URL', function(SERVER_URL){
  return {
    topic: function(topic_id, fromUser){
      return $.ajax({
        url: SERVER_URL + '/topicReport/create',
        data: {
          topicId: topic_id,
          author: fromUser
        }
      });
    },
  };
}]);
