var ta = ta || {};

ta.DictionaryFlyoutOverlay = new Class({
  Implements: [Options, Events],
  
  options: {
    className: 'dict-ta-flyout',
    evntQueue: ['dblclick', 'mousedown', 'mouseup'],
    offsetX: 12,
    offsetY: 16,
    errorMsg: '屏幕取词服务目前不可用，请稍后重试。',
    loadingMsg: '正在加载中...'
  },
  
  initialize: function(elmt, opts) {
    this.setOptions(opts);
    var self = this;
    
    self.dictFlyout = null;
    self.dictWidth = 0;
    self.dictHeight = 0;
    
    var activateEvnts, activateHandler = null;
    
    activateEvnts = self.options.evntQueue;
    activateHandler = self.flyoutLayer;
    
    var elmts = $$('#REVIEWS .'+ elmt +'[data-lang="en"]');
    if (elmts) {
      elmts.each(function(n, i) {
        n.addEvent(activateEvnts[0], activateHandler.bind(self));
        n.addEvent(activateEvnts[1], activateHandler.bind(self));
        n.addEvent(activateEvnts[2], activateHandler.bind(self));
      });
    }
    
    // hide on window scroll
    window.addEvent('scroll', self.hideOnScroll.bind(self));
    
    // hide when click on document
    document.addEvent('click', self.hideOnClickDocument.bind(self));
  },
  
  hideOnScroll: function() {
    var self = this;
    var status = (function() {
      if (self.dictFlyout) {
        return self.dictFlyout.style.display;
      }
      return 'none';
    }());
    
    if (status == '' || status === 'block') {
      self.dictFlyout.hide();
    }
  },
  
  hideOnClickDocument: function(evt) {
    var self = this;
    var sText, status, sizeX, sizeY, pageX, pageY, positionX, positionY;
    status = (self.dictFlyout) ? self.dictFlyout.style.display : 'none';
    sText = self.getSelectedText();
    
    if (status == '' || status === 'block') {
      positionX = (sText) ? self.dictFlyout.getPosition().x + self.options.offsetX : self.dictFlyout.getPosition().x;
      positionY = (sText) ? self.dictFlyout.getPosition().y - self.options.offsetY : self.dictFlyout.getPosition().y;
      pageX = evt.page.x;
      pageY = evt.page.y;
      sizeX = self.dictFlyout.getSize().x;
      sizeY = self.dictFlyout.getSize().y;
      
      if (pageX < positionX || pageY < positionY
        || pageX > (positionX + sizeX) || pageY > (positionY + sizeY)) {
        self.dictFlyout.hide();
      }
    } 
  },
  
  flyoutLayer: function(e) {
    var self = this;
    var el = $(e.target || e.srcElement);
    var sText, evtType = e.type;
    var tagName = el.tagName.toUpperCase();
    var className = el.className;
    
    if (evtType != 'mousedown') {
      e = new Event(e).stop();
    }

    if (tagName == 'P' || className.match(/^partial_entry$/)) {
      sText = self.getSelectedText().trim();
      if (sText == '' || sText.length == 1) return;

      self.dictFlyout = self.createFlyout();
      $(document.body).adopt(self.dictFlyout);

      if (evtType == 'mousedown') {
        self.clearHandler(sText, el);
      } else if (evtType == 'dblclick' && !self.isSentence(sText)) {
        self.wordHandler(sText, e);
        self.loadData(sText);
      } else if (evtType == 'mouseup' && self.isSentence(sText) && sText.length <= 200) {
        self.sentenceHandler(sText, e);
        self.loadData(sText);
      }
    }
  },
  
  createFlyout: function() {
    var self = this;
    if (self.dictFlyout == null) {
      return new Element('div', { 
        'class': self.options.className
      });
    }
    return self.dictFlyout;
  },
  
  clearHandler: function(el) {
    var self = this;
    if (self.dictFlyout != null) {
      self.dictFlyout.hide();
    }
    self.clearRange(el);
  },
  
  baseHandler: function(evt) {
    var self = this;
    var pageX = evt.page.x;
    var pageY = evt.page.y;
    
    self.dictFlyout.show();
    self.dictFlyout.style.left = (pageX - self.options.offsetX) + 'px';
    self.dictFlyout.style.top = (pageY + self.options.offsetY) + 'px';
    
    // add bing action record
    ta.actionRecord(null, null, "bing_dict_translate");
  },
  
  wordHandler: function(word, evt) {
    var self = this;
    
    self.baseHandler(evt);
    self.dictFlyout.innerHTML = word;
  },
  
  sentenceHandler: function(sentence, evt) {
    var self = this;
    
    self.baseHandler(evt);
    self.dictFlyout.innerHTML = sentence;
  },
  
  clearRange: function(elmt) {
    var range, selection;
    if (window.getSelection) {
      selection = window.getSelection();
      selection.removeAllRanges();
      range = document.createRange();
      selection.addRange(range);
    } else if (document.selection) {
      range = document.body.createTextRange();
      range.moveToElementText(elmt);
      range.select();
    }
  },
  
  getSelectedText: function() {
    if (window.getSelection) {
      return window.getSelection().toString();
    } else if (document.getSelection) {
      return document.getSelection().toString();
    } else if (document.selection) {
      return document.selection.createRange().text;
    }
  },
  
  isSentence: function(sentence) {
    return sentence.match(/\s/g);
  },
  
  isEmpty: function(obj) {
    var prop;
    
    if (obj == null) return true;
    
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) 
        return false;
    }
    return true;
  },
  
  getTrimmedText: function(sText) {
    return sText.replace(/\s+/g, '')
                .replace(/(\（|\〔)+/g, '(')
                .replace(/(\）|\〕)+/g, ')')
                .replace(/〈+/g, '<')
                .replace(/〉+/g, '>')
                .replace(/【+/g, '[')
                .replace(/】+/g, ']');
  },
  
  getKeys: function(obj) {
    var prop, keys = [];
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        keys.push(prop);
      }
    }
    return keys;
  },
  
  loadData: function(sText) {
    var self = this;
    var temp, url = '/taMSTranslationAjax?action=dd_ms_translate&query=' + encodeURIComponent(sText);
    
    new Request({
      method: 'get',
      url: url,
      onRequest: function() {
        temp = self.buildMessage(self.options.loadingMsg);
        self.dictFlyout.innerHTML = temp;
      },
      onSuccess: function(sJson) {
        var oJson = JSON.decode(sJson);
        if (self.isEmpty(oJson)) {
          temp = self.buildMessage(self.options.errorMsg);
        } else {
          temp = self.buildContent(sText, oJson);
        }
        self.dictFlyout.innerHTML = temp;
      },
      onFailure: function() {
        temp = self.buildMessage(self.options.errorMsg);
        self.dictFlyout.innerHTML = temp;
      }
    }).send();
  },
  
  buildContent: function(sText, oJson) {
    var self = this;
    var key, temp = [];
    
    temp.push('<div class="dict-ta-box">');
    temp.push('<div class="dict-ta-content">');
    temp.push('<div class="dict-ta-wap">');
    if (oJson.word) {
      temp.push('<span class="dict-ta-word">' + sText + '</span>');
      (oJson.pron) ? temp.push('<span class="dict-ta-pron">[' + oJson.pron + ']</span>') : temp.push();
      temp.push('</div>');
      
      oJson.word.each(function(itm, i) {
        key = self.getKeys(itm)[0];
        temp.push('<span class="dict-ta-pos">' + key + '.</span>');
        temp.push('<ol class="dict-ta-list">');
        temp.push('<li class="dict-ta-item">' + self.getTrimmedText(itm[key]) + '</li>');
        temp.push('</ol>');
      });
    } else if (oJson.sentence) {
      temp.push(sText);
      temp.push('</div>');
      temp.push('<span class="dict-ta-pos">机器翻译</span>');
      temp.push('<span>'+ oJson.sentence +'</span>');
    }
    temp.push('</div>');
    temp.push('<div class="dict-ta-footer">');
    temp.push('<span class="dict-ta-icon">&nbsp;</span>');
    temp.push('<a href="http://dict.bing.msn.cn" target="_blank" class="dict-ta-download">下载必应词典</a>');
    temp.push('</div>');
    temp.push('</div>');
    
    return temp.join('');
  },
  
  buildMessage: function(msg) {
    var temp = [];
    temp.push('<div class="dict-ta-box">');
    temp.push('<div class="dict-ta-content">'); 
    temp.push('<span>' + msg + '</span>'); 
    temp.push('</div>'); 
    temp.push('<div class="dict-ta-footer">'); 
    temp.push('<span class="dict-ta-icon">&nbsp;</span>'); 
    temp.push('<a class="dict-ta-download" target="_blank" href="http://dict.bing.msn.cn">下载必应词典</a>'); 
    temp.push('</div>');
    temp.push('</div>');
    return temp.join('');
  }
});
