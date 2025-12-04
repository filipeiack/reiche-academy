'use strict';

(function () {

  // CodeMirror
  const codeNonEditable = document.querySelectorAll('.code-non-editable');
  codeNonEditable.forEach(editorEl => {
    CodeMirror.fromTextArea(editorEl, {
      lineNumbers: false,
      readOnly: true,
      // theme: 'dracula'
    });
  });


  
  // Feather icons
  feather.replace();

})();