<?php

/**
 * @package Loco Automatic Translate Addon
 */

class atlt_extras{



    /*
   |----------------------------------------------------------------------------|
   |         Delete or update per day translated charachter stats               |
   | @param $value int current translated character to update in database       |
   |----------------------------------------------------------------------------|
    */
    public static function atlt_perday_translation($value = 0)
    {
        $today = get_transient('atlt_per_day_translated');
        $todays_translation = $value;
        if (false === $today) {
            delete_option('atlt_per_day_total_translated');
            update_option('atlt_per_day_total_translated', $todays_translation);
            set_transient('atlt_per_day_translated', 'true', DAY_IN_SECONDS);
        } else {
            $already_translated = intval(get_option('atlt_per_day_total_translated'));
            $todays_translation += $already_translated;
            update_option('atlt_per_day_total_translated', $todays_translation);
        }
        return $todays_translation;
    }

    

   /*
   |----------------------------------------------------------------|
   |       return the total amount of time saved on translation     |
   | @param $characters int number of translated charachters        |
   |----------------------------------------------------------------|
   */
   public static function atlt_time_saved_on_translation( $characters ){
        $total_saved = intval( $characters ) / 1800 ;
        if($characters='' || $characters<=0){
            return;
        }
        if( $total_saved >=1 && is_float( $total_saved ) ){
            $hour = intval( $total_saved );
            $minute =  $total_saved - $hour;
            $minute = intval( $minute * 60 );
            return $hour .' hour and '. round($minute,2).' minutes';
        }else{
            $minute = floatval($total_saved) * 60;
            if( $minute <1 ){
                return round($minute * 60, 2) . ' seconds';
            }
            return round($minute,2) . ' minutes';
        }
    }


}
