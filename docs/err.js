
  {
    const DEBUG = {
      dev: true, 
      err: true
    };

    setupErrorCatchers();

    function setupErrorCatchers() {
      (DEBUG.dev || DEBUG.err) && (self.onerror = (...v) => (alert(v), true));
      (DEBUG.dev || DEBUG.err) && (self.onunhandledrejection = (e) => (e.promise.catch(err => alert(err+' '+err.stack)), true));
    }

    function func() {
      if ( isMobile() ) {
        return (...x) => {
          for( const m of x ) {
            try {
              alert(m);
              alert(JSON.stringify(m));
            } catch(e) {
              alert('err'+e);
            }
          }
        };
      } else {
        return (...x) => console.log(...x)
      }
    }

    function extractMeat(list) {
      const meatIndex = list.findIndex(val => !! val && val.message || val.stack);
      if ( meatIndex == -1 || meatIndex == undefined ) {
        return "";
      } else {
        return list[meatIndex];
      }
    }
  }
