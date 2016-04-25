/**
 * SpotifyController
 *
 * @description :: Server-side logic for managing spotifies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  'index': function (req, res) {
    res.view();
  },

  'player': function (req, res) {
    res.view();
  },

  show: function (req, res) {
    var http = require('http');
    var songlist = "";
    var artist = [];
    var songTitle = [];
    var titleWords = [];
    var count = 0;
    var lyric_id = [];
    var https = require('https');
    var photoURLs = [];
    var thumbPhotoUrls = [];
    var largePhotoUrls = [];
    var real_songs= [];
    var lyrics = [];
    var lyricTitle = [];

    ////////////////////////////////////////////////////////////////////////////
    //////////////////////////get songs/////////////////////////////////////////

    function get_song_list(song, callback) {
      options3 = {
        host: 'developer.echonest.com',
        port: 80,
        path: '/api/v4/playlist/static?api_key=ELC2QPZOV4OUDIX1O&artist=' + song + '&type=artist-radio&results=4&bucket=tracks&bucket=id:spotify&limit=true',
        method: 'GET'
      };
      var webservice_request = http.request(options3, function (response) {
        process_response_song(response, song, callback)
      });
      webservice_request.end();
    };

    function process_response_song(webservice_response, song, callback) {
      var webservice_data = "";
      webservice_response.on('error', function (e) {
        console.log(e.message);
        callback('Error: ' + e.message);
      });
      webservice_response.on('data', function (chunk) {
        webservice_data += chunk;
      });
      webservice_response.on('end', function () {
        var songData = JSON.parse(webservice_data);
        var flatten = require('flat');
        var ans = flatten(songData);
        //console.log(webservice_data);

        for (var i in ans) {
          if (i.toString().indexOf("title") > -1) {
            songTitle.push(ans[i]);
            count = 1;
            var songArray = ans[i].split(" ");
            for (var x in songArray) {
              var yes = songArray[x].replace(/\b\-\b|\b\(\b|\b\)\b|\ba\b\babout\b|\babove\b|\bacross\b|\bafter\b|\bagainst\b|\baround\b|\bat\b|\bbefore\b|\bbehind\b|\bbelow\b|\bbeneath\b|\bbeside\b|\bbesides\b|\bbetween\b|\bbeyond\b|\bby\b|\bdown\b|\bduring\b|\bexcept\b|\bfor\b|\bfrom\b|\bin\b|\binside\b|\binto\b|\bits\b|\blike\b|\bnear\b|\bof\b|\boff\b|\bon\b|\bout\b|\boutside\b|\bover\b|\bsince\b|\bthe\b|\bthose\b|\bthrough\b|\bthroughout\b|\btill\b|\bto\b|\btoward\b|\bunder\b|\buntil\b|\bup\b|\bupon\b|\bwith\b|\bwithout\b/i, "");
              if(yes !== ""){
                titleWords.push(yes);
              }
            }
          }
          if (count == 1 && i.toString().indexOf("artist_name") > -1) {
            songTitle.push(ans[i]);
          }
          if (count == 1 && ans[i].toString().indexOf("spotify:track:") > -1) {
            songlist = songlist + ans[i].substring(14) + ",";
            count = 0;
          }
        }
        songlist = songlist.substring(0, songlist.length - 1);
        Spotify.songlist = songlist;
        
        for(i = 0;i < songTitle; i = i+2)
        {
          var song = [songTitle[i],songTitle[i+1]];
          console.log("song twos: "+song);
          real_songs.push(song);
        }

        callback();
      });
    };

    //function getHTML(wordList, callback) {
    //  var flatten = require('flat');
    //  var unirest = require('unirest');
    //
    //  for (var targetWord in wordList) {
    //    unirest.get("https://wordsapiv1.p.mashape.com/words/" + targetWord + "/definitions")
    //      .header("X-Mashape-Key", "x9cTSL91vPmshqr9jewsKZOC5ki7p1Laf87jsnsj1unB6izrLw")
    //      .header("Accept", "application/json")
    //      .end(function (result, callback) {
    //        var body = flatten(result.body);
    //        var tempWord = "";
    //        for (var currentLine in body) {
    //          if (currentLine.toString().indexOf("word") > -1) {
    //            tempWord = body[currentLine];
    //          }
    //          if (currentLine.toString().indexOf("partOfSpeech") > -1 && body[currentLine] == "noun") {
    //            console.log("found noun");
    //            callback();
    //          }
    //        }
    //      });
    //  }
    //};

    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////lyrics////////////////////////////////////////////

    function get_lyric_id(song, callback){
      console.log("song artist: " + song[1])
      console.log("song title: " + song[0])
      lyricTitle.push(song[0]);
      options = {
        host: 'api.musixmatch.com',
        port: 80,
        path: '/ws/1.1/track.search?apikey=50914b5c128424e7f5b036677fd64415&q_track='+encodeURIComponent(song[0])+'&q_artist='+encodeURIComponent(song[1])+'&f_has_lyrics=1',
        method: 'GET'
      };

      var webservice_request = http.request(options, function(response){
        //console.log(response);
        process_response_lyrics(response, song, callback)
      });
      webservice_request.end();
      //console.log(song.symbol +'='+song.current_price);
    };

    function process_response_lyrics(webservice_response, song, callback){
      var webservice_data ="";
      webservice_response.on('error', function(e){
        //console.log(e.message);
        callback("Error: "+e.message);
      });

      webservice_response.on('data', function(chunck){
        webservice_data += chunck;
      });

      webservice_response.on('end', function(){
        lyric_data = JSON.parse(webservice_data);

        if(lyric_data.message.body.track_list[0]){
          console.log("Track ID: "+lyric_data.message.body.track_list[0].track.track_id);//lyric_data.find("Lyric");
          lyric_id.push(lyric_data.message.body.track_list[0].track.track_id);
        }
        callback();
      });
    };

    function get_current_lyrics(song, callback){
      console.log("lyricid: " + lyric_id[0]);
      options1 = {
        host: 'api.musixmatch.com',
        port: 80,
        path: '/ws/1.1/track.lyrics.get?apikey=50914b5c128424e7f5b036677fd64415&track_id='+encodeURIComponent(lyric_id[0]),
        method: 'GET'
      };
      var web_request = http.request(options1, function(response){
        process_resp_lyrics(response, song, callback)
      });
      web_request.end();
    }

    function process_resp_lyrics(web_response, song, callback){
      var web_data ="";
      web_response.on('error', function(e){
        //console.log(e.message);
        callback("Error: "+e.message);
      });

      web_response.on('data', function(chunck){
        web_data += chunck;
      });

      web_response.on('end', function(){
        var lyric_data = JSON.parse(web_data);

        //lyric_data = JSON.parse(webservice_data);
        //console.log("\nLyrics: "+lyric_data.message.body.lyrics.lyrics_body);//lyric_data.find("Lyric");
        if(lyric_data.message.body.lyrics){
          var fulllyrics = lyric_data.message.body.lyrics.lyrics_body;
          lyrics.push(fulllyrics)
          //song.lyrics.replace(new RegExp('\r?\n','g','<br/>'));
          console.log("********Song Lyrics*****************\n\n"+fulllyrics);
        }
        else{
          lyrics.push('Lyrics for the song were not Found!');
        }
        callback();
      });
    }

    ////////////////////////////////////////////////////////////////////
    ////////////Thesaurus///////////////////////////////////////////////

    function get_synonyms(word, callback) {
      options = {
        host: 'thesaurus.altervista.org',
        port: 80,
        path: '/service.php?word=' + word + '&language=en_US&output=json&key=1zYsAxJDzVzYDFQ4JFTm',
        method: 'GET'
      }

      var webservice_request = http.request(options, function (response) {
        process_response_thes(response, word, callback)
      });
      webservice_request.end();
    };

    function process_response_thes(webservice_response, word, callback) {
      var webservice_data = "";

      webservice_response.on('error', function(e) {
        console.log(e.message);
        callback("Error: " + e.message);
      });

      webservice_response.on('data', function(chunk) {
        webservice_data += chunk;
        console.log('webservice_data: ' + webservice_data);
      });

      webservice_response.on('end', function() {
        var synonym_data = JSON.parse(webservice_data);
        var output = [];

        var flatten = require('flat');
        var ans = flatten(synonym_data);

        for (var i in ans) {
          temp = i.toString();
          if (temp.includes('synonyms')) {
            var words = ans[i].split('|');
            for (j in words) {
              if (words[j].includes('antonym')) {
                continue;
              }
              words[j] = words[j].replace(/.\(.*?\)/g, "");
              output.push(words[j]);
            }
          }
        }
        Spotify.Word_List = output;
        if(Spotify.Word_List[0] == "undefined"){
          Spotify.Word_List = titleWords;
          Spotify.photoWord = titleWords[0];
        }
        else{
          Spotify.photoWord = output[0];
        }
        callback();
      });
    };

    //////////////////////////////////////////////////////////////////////
    ///////////////////////Flikr/////////////////////////////////////////

    function get_pictures(pictures, callback) {

      /*
       IMPORTANT!!!
       Run "npm install flickrapi" so that this controller works!!!!
       Additional documentation can be found here: https://www.npmjs.com/package/flickrapi
       */
      var Flickr = require("flickrapi"), // THIS LINE NEEDS THE FLICKRAPI
        flickrOptions = {
          api_key: "14ad4814b1cbe35a2423892de0114e03",
          secret: "a9932ae943fe88f3",
          user_id: "67270572@N03",
          access_token: "72157667333500071-d8095ff24f214f07",
          access_token_secret: "2e00d16195e8c076"
        };
      Flickr.authenticate(flickrOptions, function (error, flickr) {
      });

      options = {
        host: 'api.flickr.com',
        port: 443,
        path: '/services/rest/?method=flickr.photos.search&api_key=14ad4814b1cbe35a2423892de0114e03&text=' + pictures + '&per_page=10&format=json&nojsoncallback=1',
        //path: '/services/rest/?method=flickr.photos.search&api_key=14ad4814b1cbe35a2423892de0114e03&text=' + pictures + '&per_page=10&format=json&nojsoncallback=1&auth_token=72157667333500071-d8095ff24f214f07&api_sig=2e00d16195e8c076',
        method: 'GET'
      };

      var webservice_request = https.request(options, function (response) {
        process_response_flickr(response, pictures, callback)
      });
      webservice_request.end();
    }

    function process_response_flickr(webservice_response, pictures, callback) {
      var webservice_data = "";

      webservice_response.on('error', function (e) {
        console.log(e.message);
        callback("Error: " + e.message);
      });

      webservice_response.on('data', function (chunk) {
        webservice_data += chunk;
        //console.log('webservice_data: ' + webservice_data);
      });

      // Parses JSON data for farm, server, id, and secret
      webservice_response.on('end', function () {
        picture_data = JSON.parse(webservice_data);

        var photo = {
          farm: '',
          server: '',
          id: '',
          secret: ''
        };

        for (i in picture_data.photos.photo) {
          photo.farm = picture_data.photos.photo[i].farm;
          photo.server = picture_data.photos.photo[i].server;
          photo.id = picture_data.photos.photo[i].id;
          photo.secret = picture_data.photos.photo[i].secret;

          photoURLs.push(buildPhotoUrl(photo));
          thumbPhotoUrls.push(buildThumbnailUrl(photo));
          largePhotoUrls.push(buildPhotoLargeUrl(photo));
        }

        //Spotify.Photos = photoURLs
        Spotify.Photos = largePhotoUrls
        //Spotify.thumb_Photos = thumbPhotoUrls
        callback();
      });
    };

    function buildPhotoUrl(photo) {
      var link = 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server +
        '/' + photo.id + '_' + photo.secret + '.jpg';
      //console.log('link: ' + link);
      return link;
    }

    // Builds thumbnail photo URL
    function buildThumbnailUrl(photo) {
      return 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server +
        '/' + photo.id + '_' + photo.secret + '_q.jpg';
    }

    // Builds large photo UFL
    function buildPhotoLargeUrl(photo) {
      return 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server +
        '/' + photo.id + '_' + photo.secret + '_b.jpg';
    }






    ////////////////////////////////////////////////////////////////////

    async.each([req.param('name')], get_song_list, function (err1) {
      if (err1) console.log(err1);

      console.log("titlelist: " + titleWords);
      var num = titleWords[Math.floor((Math.random() * titleWords.length))];
      console.log("finalword: " + num);
      async.each([num], get_synonyms, function (err2) {
        if(err2) console.log(err2);
        async.each([songTitle], get_lyric_id, function(err3){
          if(err3) console.log(err3);
          async.each([songTitle], get_current_lyrics, function(err4){
            if (err4) console.log(err4);
              //Spotify.Lyric = lyrics;
              //Spotify.lyricTitle = lyricTitle;
              async.each([Spotify.Word_List[0]], get_pictures, function (err5) {
              if(err5) console.log(err5)
                console.log(Spotify.Photos);
                res.view('spotify/player', {
                  spotify:Spotify
              });
            });
          })
        })
      });
    });
  }
}


