'use strict';

var request = require('request');
var moment = require('moment');
var openweather_api_key = "openweathermap_api_key";
 
module.exports = {
  metadata: () => ({
    name: 'weather.query',
    properties: {
      locationVariable: { required: true, type: 'string' },
      dateVariable: { required: true, type: 'string' },
      printVariable: { required: true, type: 'string' }
    },
    supportedActions: ['success', 'error', 'dateerror']
  }),
  invoke: (conversation, done) => {
    // retrieve variable values
    const { locationVariable } = conversation.properties();
    const { dateVariable } = conversation.properties();
    const { printVariable } = conversation.properties();

    var location = conversation.variable(locationVariable);
    var date = conversation.variable(dateVariable);

    var day = 0;
    var today = new Date();
    const now = today.getTime();
    if(date){
      const diffTime = Math.abs(date.date - now);
      day = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if(day > 7){
          conversation.transition("dateerror"); //error
          done();
          return;
      }
    }

    currentWeather(location).then(function(result){
      if(!date || day == 0){
        var printData = {
          "temp": result.main.temp,
          "weather": result.weather[0].main,
          "icon": "http://openweathermap.org/img/wn/"+result.weather[0].icon+"@2x.png",
          "date": moment().format('DD/MM/YYYY')
        };
        return printData;
      }else{
        return sevenDaysForecast(result.coord.lat, result.coord.lon).then(function(forecastResult){
          var newDate = new Date(today.getTime());
          newDate.setDate(newDate.getDate()+day);
          var printData = {
            "temp": forecastResult.daily[day].temp.day,
            "weather": forecastResult.daily[day].weather[0].main,
            "icon": "http://openweathermap.org/img/wn/"+forecastResult.daily[day].weather[0].icon+"@2x.png",
            "date": moment(newDate).format('DD/MM/YYYY')
          };
          return printData;
        }).catch(function(err){
          conversation.transition("error");
          done();
        });
      }
    }).then(function(printData){
      var printArray = new Array();
      printArray.push(printData);
      conversation.variable(printVariable, printArray);
      conversation.transition("success");
      done();
    }).catch(function(err){
      conversation.transition("error");
      done();
    });
  }
};

	var currentWeather = function(location){
	  return new Promise(function(resolve, reject){
      request('http://api.openweathermap.org/data/2.5/weather?q='+location.name+'&units=metric&appid='+openweather_api_key, { json: true }, (err, res, body) => {
        if(err){
          reject(err);
        }else{
          resolve(body);
        }
      });
	  });
	}

	var sevenDaysForecast = function(lat, lon){
	  return new Promise(function(resolve, reject){
      request('https://api.openweathermap.org/data/2.5/onecall?lat='+lat+'&lon='+lon+'&exclude=current,minutely,hourly&units=metric&appid='+openweather_api_key, { json: true }, (err, res, body) => {
        if(err){
          reject(err);
        }else{
          resolve(body);
        }
      });
	  });
	}



