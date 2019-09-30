/**
 * Script for PO file editor pages
 */
!function( window, $ ){
    var TotalCharacters=0;
    var HtmlStrings = 0;
    let event = document.createEvent('event');
    event.initEvent('atlt_translated');
    // custom popup message box
    let popup_html = '<div id="atlt-dialog-container"><div style="display:none;" id="atlt-dialog" title="Automatic Translation Progress"><p><span class="translated-label">Translated</span> <span class="translated-text">0%</span></p><div class="atlt-progress-bar-track"><div class="atlt-progress-bar-value"></div></div><div class="atlt-final-message"></div><button style="display:none;" class="atlt-ok button button-primary">OK</button></div></div>';

    $("body").append( popup_html );

    $('#atlt-dialog .atlt-ok.button').on('click',function(){
        // hide dialog container by finding main parent DOM
        $("#atlt-dialog").parent('.ui-dialog').hide();
    });

    var loco = window.locoScope,
        conf = window.locoConf,
        syncParams = null,
        saveParams = null,
      
      
        // UI translation
        translator = loco.l10n,
        sprintf = loco.string.sprintf,
     
        // PO file data
        locale = conf.locale,
        messages = loco.po.init( locale ).wrap( conf.powrap ),
        template = ! locale,
         
        // form containing action buttons
        elForm = document.getElementById('loco-actions'),
        filePath = conf.popath,
        syncPath = conf.potpath,
        
        // file system connect when file is locked
        elFilesys = document.getElementById('loco-fs'),
        fsConnect = elFilesys && loco.fs.init( elFilesys ),
        
        // prevent all write operations if readonly mode
        readonly = conf.readonly,
        editable = ! readonly,
        
        // Editor components
        editor,
        saveButton,
        innerDiv = document.getElementById('loco-editor-inner');

    /** 
     * 
     */
    function doSyncAction( callback ){
        function onSuccess( result ){
             var info = [],
                 doc = messages,
                 exp = result.po,
                 src = result.pot,
                 pot = loco.po.init().load( exp ),
                 done = doc.merge( pot ),
                 nadd = done.add.length,
                 ndel = done.del.length,
                 t = translator;
             // reload even if unchanged, cos indexes could be off
             editor.load( doc );
             // Show summary 
             if( nadd || ndel ){
                 if( src ){
                    // Translators: Where %s is the name of the POT template file. Message appears after sync
                    info.push( sprintf( t._('Merged from %s'), src ) );
                 }   
                 else {        
                    // Translators: Message appears after sync operation     
                    info.push( t._('Merged from source code') );
                 }
                 // Translators: Summary of new strings after running in-editor Sync
                 nadd && info.push( sprintf( t._n('1 new string added','%s new strings added', nadd ), nadd ) );
                 // Translators: Summary of existing strings that no longer exist after running in-editor Sync
                 ndel && info.push( sprintf( t._n('1 obsolete string removed','%s obsolete strings removed', ndel ), ndel ) );
                 // editor thinks it's saved, but we want the UI to appear otherwise
                 $(innerDiv).trigger('poUnsaved',[]);
                 updateStatus();
                 // debug info in lieu of proper merge confirmation:
                 window.console && debugMerge( console, done );
             }
             else if( src ){
                 // Translators: Message appears after sync operation when nothing has changed. %s refers to a POT file.
                 info.push( sprintf( t._('Already up to date with %s'), src ) );
             }
             else {
                 // Translators: Message appears after sync operation when nothing has changed
                 info.push( t._('Already up to date with source code') );
             }
             loco.notices.success( info.join('. ') );
             $(innerDiv).trigger('poMerge',[result]);
             // done sync
             callback && callback();
        }
        loco.ajax.post( 'sync', syncParams, onSuccess, callback );
    }

    function debugMerge( console, result ){
         var i = -1, t = result.add.length;
         while( ++i < t ){
             console.log(' + '+result.add[i].source() );
         }
         i = -1, t = result.del.length;
         while( ++i < t ){
             console.log(' - '+result.del[i].source() );
         }
    }

    /**
     * Post full editor contents to "posave" endpoint
     */    
    function doSaveAction( callback ){
        function onSuccess( result ){
            callback && callback();
            editor.save( true );
            // Update saved time update
            $('#loco-po-modified').text( result.datetime||'[datetime error]' );
        }
        saveParams.locale = String( messages.locale() || '' );
        if( fsConnect ){
            fsConnect.applyCreds( saveParams );
        }
        // adding PO source last for easier debugging in network inspector
        saveParams.data = String( messages );
        loco.ajax.post( 'save', saveParams, onSuccess, callback );
    }
    

    function saveIfDirty(){
        editor.dirty && doSaveAction();
    }
    
    

    function onUnloadWarning(){
        // Translators: Warning appears when user tries to refresh or navigate away when editor work is unsaved
        return translator._("Your changes will be lost if you continue without saving");
    }
    


    function registerSaveButton( button ){
        saveButton = button;
        // enables and disable according to save/unsave events
        editor
            .on('poUnsaved', function(){
                enable();
                $(button).addClass( 'button-primary loco-flagged' );
            } )
            .on('poSave', function(){
                disable();
                $(button).removeClass( 'button-primary loco-flagged' );
            } )
        ;
        function disable(){ 
            button.disabled = true;
        }
        function enable(){
            button.disabled = false;
        }        
        function think(){
            disable();
            $(button).addClass('loco-loading');
        }
        function unthink(){
            enable();
            $(button).removeClass('loco-loading');
        }
        saveParams = $.extend( { path: filePath }, conf.project||{} );

        $(button).click( function(event){
            event.preventDefault();
            think();
            doSaveAction( unthink );
            return false;
        } );
        return true;
    };
    
    
    
    function registerSyncButton( button ){
        var project = conf.project;
        if( project ){
            function disable(){
                button.disabled = true;
            }
            function enable(){
                button.disabled = false;
            }
            function think(){
                disable();
                $(button).addClass('loco-loading');
            }
            function unthink(){
                enable();
                $(button).removeClass('loco-loading');
            }
            // Only permit sync when document is saved
            editor
                .on('poUnsaved', function(){
                    disable();
                } )
                .on('poSave', function(){
                    enable();
                } )
            ;
            // params for sync end point
            syncParams = {
                bundle: project.bundle,
                domain: project.domain,
                type: template ? 'pot' : 'po',
                sync: syncPath||''
            };
            // enable syncing on button click
            $(button)
                .click( function(event){
                    event.preventDefault();
                    think();
                    doSyncAction( unthink );
                    return false;
                } )
                //.attr('title', syncPath ? sprintf( translator._('Update from %s'), syncPath ) : translator._('Update from source code') )
            ;
            enable();
        }
        return true;
    }
    


    function registerFuzzyButton( button ){
        var toggled = false, 
            enabled = false
        ;
        function redraw( message, state ){
            // fuzziness only makes sense when top-level string is translated
            var allowed = message && message.translated(0) || false;
            if( enabled !== allowed ){
                button.disabled = ! allowed;
                enabled = allowed;
            }
            // toggle on/off according to new fuzziness
            if( state !== toggled ){
                $(button)[ state ? 'addClass' : 'removeClass' ]('inverted');
                toggled = state;
            }
        }
        // state changes depending on whether an asset is selected and is fuzzy
        editor
            .on('poSelected', function( event, message ){
                redraw( message, message && message.fuzzy() || false );
            } )
            .on( 'poEmpty', function( event, blank, message, pluralIndex ){
                if( 0 === pluralIndex && blank === enabled ){
                    redraw( message, toggled );
                }
            } )
            .on( 'poFuzzy', function( event, message, newState ){
                redraw( message, newState );
            } )
        ;
        // click toggles current state
        $(button).click( function( event ){
            event.preventDefault();
            editor.fuzzy( ! editor.fuzzy() );
            return false;
        } );
        return true;
    };



    function registerRevertButton( button ){
        // No need for revert when document is saved
        editor
            .on('poUnsaved', function(){
                button.disabled = false;
            } )
            .on('poSave', function(){
                button.disabled = true;
            } )
        ;
        // handling unsaved state prompt with onbeforeunload, see below
        $(button).click( function( event ){
            event.preventDefault();
            location.reload();
            return false;
        } );
        return true;
    };

    function registerInvisiblesButton( button ){
        var $button = $(button);
        button.disabled = false;
        editor.on('poInvs', function( event, state ){
            $button[ state ? 'addClass' : 'removeClass' ]('inverted');
        });
        $button.click( function( event ){
            event.preventDefault();
            editor.setInvs( ! editor.getInvs() );
            return false;
        } );
        locoScope.tooltip.init($button);
        return true;
    }

    function registerCodeviewButton( button ){
         var $button = $(button);
         button.disabled = false;
         $button.click( function(event){
            event.preventDefault();
            var state = ! editor.getMono();
            editor.setMono( state );
            $button[ state ? 'addClass' : 'removeClass' ]('inverted');
            return false;
        } );
        locoScope.tooltip.init($button);
        return true;
    };

    function registerAddButton( button ){
        button.disabled = false;
        $(button).click( function( event ){
            event.preventDefault();
            // Need a placeholder guaranteed to be unique for new items
            var i = 1, baseid, msgid, regex = /(\d+)$/;
            msgid = baseid = 'New message';
            while( messages.get( msgid ) ){
                i = regex.exec(msgid) ? Math.max(i,RegExp.$1) : i;
                msgid = baseid+' '+( ++i );
            }
            editor.add( msgid );
            return false;
        } );
        return true;
    };

    function registerDelButton( button ){
        button.disabled = false;
        $(button).click( function(event){
            event.preventDefault();
            editor.del();
            return false;
        } );
        return true;
    };

    function registerDownloadButton( button, id ){
        button.disabled = false;
        $(button).click( function( event ){
            var form = button.form,
                path = filePath;
            // swap out path
            if( 'binary' === id ){
                path = path.replace(/\.po$/,'.mo');
            }
            form.path.value = path;
            form.source.value = messages.toString();
            // allow form to submit
            return true;
        } );
        return true;
    }

    
    // event handler that stops dead
    function noop( event ){
        event.preventDefault();
        return false;
    }


    /*/ dummy function for enabling buttons that do nothing (or do something inherently)
    function registerNoopButton( button ){
        return true;
    }*/
    

    
    /**
     * Update status message above editor.
     * This is dynamic version of PHP Loco_gettext_Metadata::getProgressSummary
     * TODO implement progress bar, not just text.
     */
    function updateStatus(){
        var t = translator,
            stats = editor.stats(),
            total = stats.t,
            fuzzy = stats.f,
            empty = stats.u,
            // Translators: Shows total string count at top of editor
            stext = sprintf( t._n('1 string','%s strings',total ), total.format(0) ),
            extra = [];
        if( locale ){
            // Translators: Shows percentage translated at top of editor
            stext = sprintf( t._('%s%% translated'), stats.p.replace('%','') ) +', '+ stext;
            // Translators: Shows number of fuzzy strings at top of editor
            fuzzy && extra.push( sprintf( t._('%s fuzzy'), fuzzy.format(0) ) );
            // Translators: Shows number of untranslated strings at top of editor
            empty && extra.push( sprintf( t._('%s untranslated'), empty.format(0) ) );
            if( extra.length ){
                stext += ' ('+extra.join(', ')+')';
            }
        }
        $('#loco-po-status').text( stext );
        if( typeof window.locoEditorStats == 'undefined'){
            window.locoEditorStats = {totalWords:stats.t, totalTranslated:stats.p} ;
        }else{
            window.locoEditorStats.totalWords = stats.t;
            window.locoEditorStats.totalTranslated = stats.p;
        }
        
    }
    
    
    
    /**
     * Enable text filtering
     */
    function initSearchFilter( elSearch ){
        editor.searchable( loco.fulltext.init() );
        // prep search text field
        elSearch.disabled = false;
        elSearch.value = '';
        function showValidFilter( numFound ){
            $(elSearch.parentNode)[ numFound || null == numFound ? 'removeClass' : 'addClass' ]('invalid');
        }
        var listener = loco.watchtext( elSearch, function( value ){
            var numFound = editor.filter( value, true  );
            showValidFilter( numFound );
        } );
        editor
            .on( 'poFilter', function( event, value, numFound ){
                listener.val( value||'' );
                showValidFilter( numFound );
            } )
            .on( 'poMerge', function( event, result ){
                var value = listener.val();
                value && editor.filter( value );
            } )
        ;
    }    
    
    
    
    // resize function fits editor to screen, accounting for headroom and touching bottom of screen.
    var resize = function(){
        function top( el, ancestor ){
            var y = el.offsetTop||0;
            while( ( el = el.offsetParent ) && el !== ancestor ){
                y += el.offsetTop||0;
            } 
            return y;    
        }
        var fixHeight,
            minHeight = parseInt($(innerDiv).css('min-height')||0)
        ;
        return function(){
            var padBottom = 20,
                topBanner = top( innerDiv, document.body ),
                winHeight = window.innerHeight,
                setHeight = Math.max( minHeight, winHeight - topBanner - padBottom )
            ;
            if( fixHeight !== setHeight ){
                innerDiv.style.height = String(setHeight)+'px';
                fixHeight = setHeight;
            }
        };
    }();    

    // ensure outer resize is handled before editor's internal resize
    resize();
    $(window).resize( resize );

    // initialize editor    
    innerDiv.innerHTML = '';
    editor = loco.po.ed
        .init( innerDiv )
        .localise( translator )
    ;
    loco.po.kbd
        .init( editor )
        .add( 'save', saveIfDirty )
        .enable('copy','clear','enter','next','prev','fuzzy','save','invis')
    ;

    // initialize toolbar button actions
    var buttons = {
        // help: registerNoopButton,
        save: editable && registerSaveButton,
        sync: editable && registerSyncButton,
        revert: registerRevertButton,
        // editor mode togglers
        invs: registerInvisiblesButton,
        code: registerCodeviewButton,
        // downloads / post-throughs
        source: registerDownloadButton,
        binary: template ? null : registerDownloadButton
    };
    // POT only
    if( template ){
        buttons.add = editable && registerAddButton;
        buttons.del = editable && registerDelButton;
    }
    // PO only
    else {
        buttons.fuzzy = registerFuzzyButton;
    };
    $('#loco-toolbar').find('button').each( function(i,el){
        var id = el.getAttribute('data-loco'), register = buttons[id];
        register && register(el,id) || $(el).hide();
    } );
    
    // disable submit on dummy form
    $(elForm).submit( noop );

    // enable text filtering
    initSearchFilter( document.getElementById('loco-search') );    

    // editor event behaviours
    editor
        .on('poUnsaved', function(){
            window.onbeforeunload = onUnloadWarning;
        } )
        .on('poSave', function(){
            updateStatus();
            window.onbeforeunload = null;
        } )
        .on( 'poUpdate', updateStatus );
    ;
    
    // load raw message data
    messages.load( conf.podata );
    
    // ready to render editor
    editor.load( messages );
    
    // locale should be cast to full object once set in editor
    if( locale = editor.targetLocale ){
        locale.isRTL() && $(innerDiv).addClass('trg-rtl');
    }
    // enable template mode when no target locale 
    else {
        editor.unlock();
    }


/*
|--------------------------------------------------------------------------
|   Auto Translator Custom Code
|--------------------------------------------------------------------------
*/

    function createEncodedString(allStringText){
            const queryString=allStringText.map((item)=>{
                 return "&text="+ encodeURIComponent(item.source);
            }).join(",");
            
             return queryString;
        } 
  
function addAutoTranslationBtn(){
    if($("#loco-toolbar").find("#cool-auto-translate-btn").length>0){
        $("#loco-toolbar").find("#cool-auto-translate-btn").remove();
    }

    if( ATLT == '' || ATLT["api_key"] == '' || ATLT["api_key"]["atlt_api-key"]=='' ){
        $("#loco-toolbar").find("#loco-actions")
        .append('<fieldset><button title="Add API key to enable this feature." id="cool-auto-translate-btn" disabled class="button has-icon icon-translate">Auto Translate</button> <a style="font-size:9px;display:block;margin-left:8px;" target="_blank" href="https://tech.yandex.com/translate/">Get Free API Key</a></fieldset>');
        return; 
    } else if( window.locoEditorStats.totalTranslated != "100%" && window.locoEditorStats.totalWords > 0 ){
        $("#loco-toolbar").find("#loco-actions")
        .append('<fieldset><button id="cool-auto-translate-btn" class="button has-icon icon-translate">Auto Translate</button> <a style="font-size:9px;display:block;margin-left:8px;" target="_blank" href="http://translate.yandex.com/">Powered by Yandex.Translate</a></fieldset>');
    } else if( window.locoEditorStats.totalWords == 0){
        return;
    } else {
        $("#loco-toolbar").find("#loco-actions")
        .append('<fieldset><button id="cool-auto-translate-btn" class="button has-icon icon-translate" disabled>Translated</button></fieldset>');
    }
}

$(document).ready(function(){
    const locoRawData=conf.podata;
    
    if(locoRawData!=undefined && locoRawData.length>0 ){
        
        addAutoTranslationBtn();
      
    }
    let translationObj = {};
   
    $(document)
    // Bind translate function to translate button
    .on("click", "#cool-auto-translate-btn", function() {
      
        $(this).text('...Translating');
      //  const targetLang=conf.locale.lang;
        
        const apiKey = ATLT["api_key"]["lat_api-key"];


        if(locoRawData!=undefined && locoRawData.length>0 && apiKey!='' ){
            let untranslatedTextArr=locoRawData.filter((item,index)=>{
                // if(item.target===undefined || item.target=="" && savedIndex<=90){
                if( (item.target===undefined || item.target=="") && (item.source).includes('</') == false && (item.source).includes('/>') == false && (item.source).includes('#') == false ){
                    return true;
                }else{
                    HtmlStrings++;
                }
                
            });
            translationObj = {
                sourceLang:'en',
                targetLang:conf['locale']["lang"],
                textToTranslateArr:untranslatedTextArr,
                orginalArr:conf.podata,
                apiKey:apiKey,
                thisBtn:$(this),
                saveBtn: $('[data-loco="save"]')
                };
        if (translationObj.targetLang !== null && translationObj.textToTranslateArr !== null) {
            
           window.locoEditorStats.untranslatedTextArr = translationObj;
           jQuery(document).trigger('atlt_translated');
           //atlt_translate(translationObj);
           
            // load raw message data
        
            }  

        } 
     
    });
  
});

jQuery(document).on('atlt_translated',function(){
    let textToTranslate = window.locoEditorStats.untranslatedTextArr.textToTranslateArr
    let totalTranslated = window.locoEditorStats.totalTranslated
    const apiKey = ATLT["api_key"]["lat_api-key"];
    let indexRequest = 50;
    if( ATLT.api_key['atlt_index-per-request'] != "" && typeof ATLT.api_key['atlt_index-per-request'] != "undefined" ){
        indexRequest = ATLT.api_key['atlt_index-per-request'];
    }
    if( typeof textToTranslate == "object" && textToTranslate.length >= 1 ){
        let translationO = {
            sourceLang:'en',
            targetLang:conf['locale']["lang"],
            textToTranslateArr:textToTranslate.slice(indexRequest),
            orginalArr:conf.podata,
            apiKey:apiKey,
            thisBtn:window.locoEditorStats.untranslatedTextArr.thisBtn,
            saveBtn: $('[data-loco="save"]')
            };
        window.locoEditorStats.untranslatedTextArr = translationO;
        let data =  {
            sourceLang:'en',
            targetLang:conf['locale']["lang"],
            textToTranslateArr:textToTranslate.slice(0,indexRequest),
            orginalArr:conf.podata,
            apiKey:apiKey,
            thisBtn:window.locoEditorStats.untranslatedTextArr.thisBtn,
            saveBtn: $('[data-loco="save"]')
            };

            textToTranslate.slice(0,indexRequest).map(function(value,index){
                TotalCharacters += (value.source).length;
            })
             
        $('#atlt-dialog').dialog({width:320});

        atlt_translate(data);
    }else if( HtmlStrings >= 1){
        alert('Remaining HTML strings can not be auto translate!');
        window.location.reload();
    }
})

// Translate
function atlt_translate(data) {
    
    atlt_ajax_translation_request(data, "POST").success(function(
      resp
    ) {
        const json_resp = JSON.parse(resp);
        if( json_resp == false ){
            alert('Unable to make request to the server at the moment. Try again later.');
        }else if( typeof json_resp['code'] === undefined || json_resp['code'] != 200 ){            
            let error = '';
            switch(json_resp['code']){
                case 401:
                    error = 'Yendex API Key is invalid!';
                break;
                case 402:
                    error = 'Provided Yendex API Key has been blocked!';
                break;
                case 404:
                    error = 'Exceeded the daily limit for Yendex API on the amount of translated text.';
                break;
                case 422:
                    error = 'The text cannot be translated by Yendex API.';
                break;
                case 501:
                    error = 'Yendex API does not support the specified translation direction.';
                break;
                default:
                    error = json_resp['message'];
            }
            if( error != '' && (window.locoEditorStats.untranslatedTextArr.textToTranslateArr).length != 0 ){
                $('#atlt-dialog .atlt-final-message').html("<strong>"+error+"</strong>");
                $('#atlt-dialog .atlt-ok.button').show();
                data.thisBtn.text('Translation');
                data.thisBtn.attr('disabled','disabled');
            }
            return;
        }
        let totalTranslated = window.locoEditorStats.totalTranslated;
        
        var response =  json_resp['text'];

        if(response!==undefined){
            for(i=0;i< response.length;i++){
                    var text = response[i];
                    if( data.textToTranslateArr[i] === undefined ){
                        break;
                    }
                        data.textToTranslateArr[i].target = text ;
                      
            }
        }
        var mergeTranslatedText = atlt_arrayUnique(data['textToTranslateArr'].concat(data['orginalArr']) ),
        textForTranslation = data['textToTranslateArr'],
        Emptytargets = []
        for(var x=0; x<textForTranslation.length;++x){
            if(textForTranslation[x].target !='' ){
                Emptytargets[x]=textForTranslation[x].source;
            }
        }

           messages = loco.po.init( locale ).wrap( conf.powrap );
            // ready to render editor
            messages.load(mergeTranslatedText);
            
            // editor event behaviours
            editor
            .on('poUnsaved', function(){
                window.onbeforeunload = onUnloadWarning;
            } )
            .on('poSave', function(){
                updateStatus();
                window.onbeforeunload = null;
            } )
            .on( 'poUpdate', updateStatus );
        
            // ready to render editor
            editor.load(messages);
            data.saveBtn.addClass( 'button-primary loco-flagged' ).removeAttr("disabled");
            updateStatus();
            
            // update progress bar
            $('#atlt-dialog .translated-label').text('Translated');
            $('#atlt-dialog .translated-text').text(window.locoEditorStats.totalTranslated);
            
            $('#atlt-dialog .atlt-progress-bar-value').width(window.locoEditorStats.totalTranslated);

            var saved_time_msg = '<br/><br/><span style="border: 3px solid #14b75d;display: inline-block;padding: 3px;">Wahooo! You have saved your <strong>'+json_resp['stats']['time_saved']+'</strong> using <strong><a href="https://wordpress.org/support/plugin/automatic-translator-addon-for-loco-translate/reviews/#new-post" target="_new">Loco Automatic Translate Addon</a></strong>.</span><br/><br/>';

            switch( window.locoEditorStats.totalTranslated ){
                case "0%":
                    $('#atlt-dialog .translated-label').text('Translating...');
                    $('#atlt-dialog .translated-text').text('');
                break;
                case "100%":
                    data.thisBtn.text('Translated');
                    data.thisBtn.attr('disabled','disabled');
                    // change cursor to 'default' state
                    $('#atlt-dialog .atlt-final-message').html("<strong style='font-size:18px;display:inline-block;margin:5px auto;'>Translation Complete!</strong><br/>(Close this popup & Click <strong>Save</strong>)"+saved_time_msg);
                    $('#atlt-dialog .atlt-ok.button').show();
                    return;
                break;
            }

            // run through DOM and mark *(STAR) for newly translated
            for(var x=0;x<=Emptytargets.length;x++){
                var source = Emptytargets[x];
                jQuery("#po-list-tbody div[for='po-list-col-source'] div").filter(function(index){
                    return jQuery(this).text() == source 
                }).addClass('po-unsaved');
            }

            if( (window.locoEditorStats.untranslatedTextArr.textToTranslateArr).length == 0){
                data.thisBtn.text('Translated');
                data.thisBtn.attr('disabled','disabled');
                // change cursor to 'default' state
                $('#atlt-dialog .atlt-final-message').html("<strong style='font-size:18px;display:inline-block;margin:5px auto;'>Translation Complete!</strong><br/>(Close this popup & Click <strong>Save</strong>)<br/><br/>Text with HTML content can not be translated."+saved_time_msg);
                $('#atlt-dialog .atlt-ok.button').show();
                return;
            }

            jQuery(document).trigger('atlt_translated');
    });
  }
  
// Abstract API request function
function makeApiRequest(data, type) {
    // send text to translate
    url = "https://translate.yandex.net/api/v1.5/tr.json/translate";
    url += "?key=" + data.apiKey;
    url += "&lang="+data.sourceLang+'-'+ data.targetLang;
    url += createEncodedString(data.textToTranslateArr);
   
 // Return response from API
console.log(createEncodedString(data.textToTranslateArr))
 const newArr=data.textToTranslateArr.map((item)=>{
        if(item.source!==undefined){
            return  obj={text:item.source};
        }
            });
            console.log(  newArr);
 return $.ajax({
    url: url,
    type: type || "GET",
    dataType:'jsonp',
    data:newArr,
    crossDomain:true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  }); 
}

function atlt_arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

function atlt_ajax_translation_request(data,type){

    const newArr=data.textToTranslateArr.map((item)=>{
        if( typeof item.source!= 'undefined'){
            //return  obj='['+item.source+']';
            return  obj=  encodeURI( item.source );
        }
            });
    return jQuery.ajax({
        url: ajaxurl,
        type:'POST',
        data: {'action':'atlt_translation',
                'sourceLan':data.sourceLang,
                'targetLan':data.targetLang,
                'totalCharacters': TotalCharacters,
                'data':newArr
            },
            done:function(res){
                console.log(res)
            }
       
    });
}

// refresh page on save only if there are pending translation
/* jQuery(document).on('poSave',function(){
    if( locoEditorStats.totalTranslated != "100%" ){
        setTimeout(function(){ window.location.reload(); }, 500);
    }
}) */
 
    // ok, editor ready
    updateStatus();
 
    // clean up
  //delete window.locoConf;
  //conf = buttons = null;

}( window, jQuery );