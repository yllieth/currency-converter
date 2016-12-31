angular
  .module('ExtensionApp', [])
  .constant('APIKEY', 'b2a905f079253f43cbda5191c62cb3d2')
  .constant('ENDPOINT', 'http://apilayer.net/api/live')
  .constant('CURRENCIES', ['EUR', 'USD', 'CAD', 'GBP'])
  .constant('CACHELIMIT', 604800) /* 7 * 24 * 60 * 60 = 7 jours */
  .controller('PopupController', function($q, $http, APIKEY, CURRENCIES, CACHELIMIT, ENDPOINT) {
    var self = this;

    // --------------------------------------------------------------------------

    function now(seconds) {
      seconds = seconds || false;
      var timestamp = (new Date()).getTime();

      return (seconds) 
        ? parseInt(timestamp / 1000)
        : timestamp;
    }

    function isSettedUp(selector) {
      return selector.from !== '---' && selector.to !== '---';
    }

    function fetchData() {
      if (localStorage) {
        var mostRecent = Math.max(...Object.keys(localStorage));
        var time = now(true);  // timestamp in seconds

        if (time - mostRecent < CACHELIMIT) {
          var cacheData = JSON.parse(localStorage.getItem(mostRecent));
          var deferred = $q.defer();
        }
      }

      if (cacheData && deferred) {
        deferred.resolve({
          config: { url: "[CACHE] - " + ENDPOINT },
          data: {
            timestamp: mostRecent,
            source: 'USD',
            quotes: cacheData
          }
        });

        return deferred.promise;
      } else {
        var config = {
          headers: {},
          params: {
            access_key: APIKEY,
            currencies: CURRENCIES.join(','),
            source: 'USD',
            format: 1
          }
        };

        return $http.get(ENDPOINT, config);
      }
    }

    function convert(amount, from, to) {
      self.result = undefined;
      self.rate = {
        value: 0,
        lastUpdate: 'in progress ...'
      };

      fetchData()
        .then(function(response) {
          var rates = response.data;

          if (localStorage) {
            localStorage.setItem(rates.timestamp, JSON.stringify(rates.quotes));
          }

          self.rate = {
            value: computeRates(rates.quotes, from, to),
            lastUpdate: rates.timestamp * 1000,
            source: response.config.url
          };

          self.result = amount * self.rate.value;
        });
    }

    // The free plan of currencylayer.com only allow to requests USD-based rates (USD -> EUR, USD -> CAD, ...)
    // This function calculates the proper rate.
    // Ex: EURCAD = USDCAD / USDEUR, GBPPLN = USDPLN / USDGBP, ...
    function computeRates(rates, from, to) {
      if (from === 'USD') {
        return rates[from + to];
      } else if (to === 'USD') {
        return 1 / rates[to + from];
      } else {
        return rates['USD' + to] / rates['USD' + from];
      }
    }

    // --------------------------------------------------------------------------

    // Select box with supported currencies
    this.currencies = {
      from: CURRENCIES,
      to: []
    }

    // Chosen currencies
  	this.selector = {
  	  from: '---',
  	  to: '---'
  	};

    // Rate details (when available)
    this.rate = {
      value: null,
      lastUpdate: null,
      source: null
    };

    this.toConvert = undefined;
    this.result = undefined;
    this.readyToConvert = false;

    this.onBaseChange = function() {
      var newBase = this.selector.from;

      this.currencies.to = CURRENCIES.filter(function(currency) {
        return currency != newBase;
      });

      this.readyToConvert = isSettedUp(this.selector);

      if (this.readyToConvert === true) {
        this.toConvert = 1;
        convert(this.toConvert, this.selector.from, this.selector.to);
      }
    }

    this.onDestChange = function() {
      this.readyToConvert = isSettedUp(this.selector);

      if (this.readyToConvert === true) {
        this.toConvert = 1;
        convert(this.toConvert, this.selector.from, this.selector.to);
      }
    }

    this.convert = function() {
      var readyToConvert = isSettedUp(this.selector);
      var convertible = this.rate.value !== null;

      if (readyToConvert && convertible) {
        this.result = this.toConvert * this.rate.value;
      }
    }

    this.resetCache = function() {
      localStorage.clear();
      this.readyToConvert = isSettedUp(this.selector);

      if (this.readyToConvert === true) {
        convert(this.toConvert, this.selector.from, this.selector.to);
      }
    }
  })