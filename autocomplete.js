(function (mod) {
  if (typeof exports === 'object' && typeof module === 'object') { // CommonJS
    mod(
      require('codemirror/lib/codemirror'),
      require('codemirror/addon/hint/show-hint')
    );
  } else if (typeof define === 'function' && define.amd) { // AMD
    define([
      'codemirror/lib/codemirror',
      'codemirror/addon/hint/show-hint',
    ], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
}
)(function (CodeMirror) {
  'use strict';

  CodeMirror.defineOption('hrAutoComplete', [], function (cm, value, old) {
      var hrSocket = new WebSocket('wss://autosuggest.hackerrank.com');

      hrSocket.onopen = function (event) {
        window.hrSocket = hrSocket;
      };

      hrSocket.onmessage = function (e) {
        cm.showHint({
          completeSingle: true,
          alignWithWord: true,
          closeOnUnfocus: true,
          hint: function (cm, options) {
            var data = JSON.parse(e.data);

            var list = data.map(function (suggestion) {
              return { text: suggestion.completion + ' ', displayText: suggestion.text };
            });

            var cur = cm.getCursor();
            var token = cm.getTokenAt(cur);
            var start = token.start;
            var end = token.end;
            return {
                list: list,
                from: CodeMirror.Pos(cur.line, start),
                to: CodeMirror.Pos(cur.line, end),
              };
          },
        });
      };

      hrSocket.onclose = function (e) {
        console.log('Closing Connection!');
        console.log(e);
      };

      hrSocket.onerror = function (e) {
        console.log('An error occured !!!');
        console.log(e);
      };
    });

  CodeMirror.commands.hrAutoComplete = function (cm) {
      var cursor = cm.getCursor();
      var mode = cm.getModeAt(cursor).name;

      var wordRange = cm.findWordAt(cursor);
      var word = cm.getRange(wordRange.anchor, wordRange.head);
      var column = cursor.ch;
      var line = cursor.line;

      var code = cm.getValue();

      var query = JSON.stringify({ body: { code: code, fileType: mode,
        column: column, line: line,  wordToComplete: word, offset: column, }, });

      window.hrSocket.send(query);
    };

  CodeMirror.keyMap['default']['Ctrl-Space'] = 'hrAutoComplete';
});
