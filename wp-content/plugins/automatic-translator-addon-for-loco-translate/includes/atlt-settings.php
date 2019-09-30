<?php
/*
|------------------------------------------------------------------------
|   Settings panel
|------------------------------------------------------------------------
*/
if( !class_exists( 'Atlt_Settings_Panel' ) ){
    class Atlt_Settings_Panel {
        
        public $settings_api;
        public $PREFIX;

        public function __construct(){
                $this->settings_api = new Atlt_Settings_API;
                $this->PREFIX = 'atlt_';

                add_action('admin_init', array($this, 'admin_init' ) );
                add_action('admin_menu', array( $this, 'admin_menu' ),100 );
                add_action('admin_notices', array( $this, 'missing_api_key') );
        }


        /*
        |------------------------------------------
        |    Initialize settings section
        |------------------------------------------
        */
        public function admin_init(){

            $this->settings_api->set_sections( $this->get_settings_sections() );            
            $this->settings_api->set_fields( $this->get_settings_fields() );            
            $this->settings_api->admin_init();
        }

        /*
        |--------------------------------------------------------------------
        |   Create multiple section in settings page using array in $sections
        |--------------------------------------------------------------------
        */
        public function get_settings_sections()
        {
                $sections = array(

                    array(
                        'id' => $this->PREFIX.'register',
                        'title' => __('Loco Automatic Translate Addon Settings', 'cmb2'),
                    )
                );
                return $sections;
        }

        /*
        |--------------------------------------------------------------------
        |   return all settings fields to be initialized in settings page
        |--------------------------------------------------------------------
        */
        public function get_settings_fields()
        {
            $trans = get_option('atlt_grandTotal_translated');
            $total_translation = empty($trans)?0:$trans;
            $todays_total_translation = get_option('atlt_per_day_total_translated', 0);
            $settings_fields = array(

                $this->PREFIX.'register'    =>  array(
                
                    array(
                        'name'  => $this->PREFIX.'api-key',
                        'id'    => $this->PREFIX.'api-key',
                        'class' => $this->PREFIX.'settings-field',
                        'label'  => 'Yendex API Key:',
                        'desc'  => '<a target="_blank" href="https://tech.yandex.com/translate/">Get Free Yendex API Key</a><br/>',
                        'type'  => 'text',
                        'placeholder'=>__('Enter API Key','cmb2'),
                        'default' => '',
                    ),
                    array(
                        'name'  => $this->PREFIX.'index-per-request',
                        'id'    => $this->PREFIX.'index-per-request',
                        'class' => $this->PREFIX.'settings-field',
                        'label'  => 'Index per request:',
                        'desc'  => 'Number for index to send in per request.'.$this->welcome_tab(),
                        'type'  => 'number',
                        'placeholder'=>__('50','cmb2'),
                        'default' => '50',
                    ),
                    array(
                        'name'  => $this->PREFIX.'translated-grandtotal-char',
                        'id'    => $this->PREFIX.'translated-grandtotal-char',
                        'class' => $this->PREFIX.'settings-field',
                        'label'  => 'Total translated charachters.',
                        'desc'  => 'You have translated '.$total_translation.' charachters so far',
                        'type'  => 'html',
                        'default' => '50',
                    ),
                    array(
                        'name'  => $this->PREFIX.'translated-todaystotal-char',
                        'id'    => $this->PREFIX.'translated-todaystotal-char',
                        'class' => $this->PREFIX.'settings-field',
                        'label'  => 'Total translated charachters today.',
                        'desc'  => 'You have translated '.$todays_total_translation.' charachters today',
                        'type'  => 'html',
                        'default' => '50',
                    ),
                    array(
                        'name'  => $this->PREFIX.'rating',
                        'id'    => $this->PREFIX.'rating',
                        'label'  => 'Please share your valuable feedback.',
                        'desc'  => $this->rate_now(),
                        'type'  => 'html',
                        'default' => '',
                    ),
                    array(
                        'name'  => $this->PREFIX.'screenshort',
                        'id'    => $this->PREFIX.'screenshort',
                        'label'  => 'Usage instructions',
                        'desc'  => $this->screenshort(),
                        'type'  => 'html',
                        'default' => '',
                    )
                ),
                
            );
            return $settings_fields;
        }

        public function welcome_tab(){
            //$this->ce_get_option($this->PREFIX.'-api-key');
            return get_submit_button('Save');

        }

        public function rate_now(){
            $like_it_text='Rate Now! ★★★★★';
            $p_link=esc_url('https://wordpress.org/support/plugin/automatic-translator-addon-for-loco-translate/reviews/#new-post');
            $ajax_url=admin_url( 'admin-ajax.php' );
            $html ='<p>Thanks for using Loco Automatic Translate Addon - WordPress plugin. We hope it has saved your valuable time and efforts! <br/>Please give us a quick rating, it works as a boost for us to keep working on more <a href="https://coolplugins.net/">Cool Plugins!</a></p>
            <a href="'.$p_link.'" class="like_it_btn button button-primary" target="_new" title="'.$like_it_text.'">'.$like_it_text.'</a>
            ';            
            return $html;
        }

        public function screenshort(){
            
            $src = ATLT_URL .'assets/images/screenshot-1.gif';
            
            $html = '<img src="'.$src.'" width="100%">';

            return $html;
        }
        /*
        |---------------------------------------------------
        |   Add settings page to wordpress menu
        |---------------------------------------------------
        */
        public function admin_menu()
        {
                add_submenu_page( 'loco','Loco Auto Translator', 'Loco Auto Translator', 'manage_options', 'loco-atlt', array($this, 'atlt_settings_page'));
        }

        public function atlt_settings_page(){
            
            $this->settings_api->show_navigation();
            $this->settings_api->show_forms('Save',false);

        }

        /*
        |---------------------------------------------------------
        |   Gather settings field-values like get_options()
        |---------------------------------------------------------
        */
        public function ce_get_option($option, $default = '')
        {

            $section = $this->PREFIX.'register';
            $options = get_option($section);

            if (isset($options[$option])) {
                return $options[$option];
            }

            return $default;
        }

        /*
        |-----------------------------------------------------------
        |   Show message in case of no api-key is saved
        |-----------------------------------------------------------
        */
        public function missing_api_key(){

            $api_key = $this->ce_get_option( $this->PREFIX.'api-key');

            if( isset( $api_key ) && !empty( $api_key ) ){
                return;
            }

            // Show API message only in translation editor page
            if( isset($_REQUEST['action']) && $_REQUEST['action'] == 'file-edit' ){
                $plugin_info = get_plugin_data( ATLT_FILE , true, true );

                $message = sprintf('You must provide an %s to use the functionality of <strong>%s</strong>','<a href="'.admin_url('admin.php?page=loco-atlt').'">API key</a>',$plugin_info['Name']);

                $translation = __($message,'atlt');

                $HTML = '<div class="notice notice-warning inline is-dismissible"><p>'.$translation.'</p></div>';
                echo $HTML;
            }else if( isset( $_REQUEST['page'] ) && $_REQUEST['page'] == 'loco-atlt' ){
                
                $message = sprintf('Get a free API KEY from %s and save it below to enable the Auto Translation feature.','<a href="https://tech.yandex.com/translate/" target="_blank">Yandex.com</a>');
                
                $translation = __($message,'atlt');

                $HTML = '<div class="notice notice-warning inline is-dismissible"><p>'.$translation.'</p></div>';

                echo $HTML;
            }
        }
        
    }
    
}