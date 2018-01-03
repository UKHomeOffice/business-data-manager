'use strict';

let counter = 1;
// var limit = 3;

function addInput(divName){
  let formSection = `            <legend>
                <span class="heading-small">Field 1</span>
              </legend>
              <div class="form-group">
                <label class="form-label" for="fields">Field name</label>
                <input class="form-control" id="fieldNames" name="fieldNames[]" type="text">
              </div>
              <div class="form-group">
                <fieldset class="inline">
                  <legend>
                    <span class="body-text">Field data type</h1>
                  </legend>
                  <div class="multiple-choice">
                    <input id="radio-1" type="radio" name="fieldDataTypes[]" value="varchar">
                    <label for="radio-1">Text</label>
                  </div>
                  <div class="multiple-choice">
                    <input id="radio-2" type="radio" name="fieldDataTypes[]" value="date">
                    <label for="radio-2">Date</label>
                  </div>
                  <div class="multiple-choice">
                    <input id="radio-3" type="radio" name="fieldDataTypes[]" value="integer">
                    <label for="radio-3">Integer</label>
                  </div>
                </fieldset>
              </div>
              <div class="form-group">
                <fieldset class="inline">
                  <legend>
                    <h1 class="body-text">Primary key?</h1>
                  </legend>
                  <div class="multiple-choice">
                    <input id="fieldPrimaryKeys-1" type="radio" name="fieldPrimaryKeys[]" value="Yes">
                    <label for="fieldPrimaryKeys-1">Yes</label>
                  </div>
                  <div class="multiple-choice">
                    <input id="fieldPrimaryKeys-2" type="radio" name="fieldPrimaryKeys[]" value="No">
                    <label for="fieldPrimaryKeys-2">No</label>
                  </div>
                </fieldset>
              </div>
              <div class="form-group">
                <fieldset class="inline">
                  <legend>
                    <h1 class="body-text">Not null?</h1>
                  </legend>

                  <div class="multiple-choice">
                    <input id="fieldNotNulls-1" type="radio" name="fieldNotNulls[]" value="Yes">
                    <label for="fieldNotNulls-1">Yes</label>
                  </div>
                  <div class="multiple-choice">
                    <input id="fieldNotNulls-2" type="radio" name="fieldNotNulls[]" value="No">
                    <label for="fieldNotNulls-2">No</label>
                  </div>
                </fieldset>
              </div>
              <div class="form-group">
                <fieldset class="inline">
                  <legend>
                    <h1 class="body-text">Unique?</h1>
                  </legend>
                  <div class="multiple-choice">
                    <input id="fieldUniques-1" type="radio" name="fieldUniques[]" value="Yes">
                    <label for="fieldUniques-1">Yes</label>
                  </div>
                  <div class="multiple-choice">
                    <input id="fieldUniques-2" type="radio" name="fieldUniques[]" value="No">
                    <label for="fieldUniques-2">No</label>
                  </div>
                </fieldset>
              </div>
`



  if (counter == limit)  {
    alert("You have reached the limit of adding " + counter + " inputs");
  }
  else {
    let newdiv = document.createElement('div');
    newdiv.innerHTML = formSection;
    document.getElementById(divName).appendChild(newdiv);
    counter++;
  }
}
