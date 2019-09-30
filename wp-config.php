<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'wordpress' );

/** MySQL database username */
define( 'DB_USER', 'root' );

/** MySQL database password */
define( 'DB_PASSWORD', '' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '3t+v(kBJV>,Xmlot?W5 seKNoe^Fa]HMZC2El[0|R+S?RS2D}GYH+.lmnx0s{-lo' );
define( 'SECURE_AUTH_KEY',  'Ehq/wIOII-VOF{}THsqKndOq23|[V?rfy^@^+sCm}=G~e,$iyz WeiuA[AE[VGE)' );
define( 'LOGGED_IN_KEY',    '~ D^{s+Dj.ayV/T8pqDq,:.WZM;+)OMHY%nPPmmh&p@dz.Yrr}uGM!k1`lZ%54G[' );
define( 'NONCE_KEY',        'Ss,8SW(EC!Mp6gfNX=o(=9.9**weej(pV[}r*|=C6dGK7H2]|}mu9{hJ5XbDlEEi' );
define( 'AUTH_SALT',        'cP$5.(;zr^Gf/b0fcZ}Fu7D sfO2~[u!rCBt(9^xU&HUBlUJo^D.*,*@s5~U5fH ' );
define( 'SECURE_AUTH_SALT', '>^)BWF}`:q{mHJ-@huK)u|Py<2~My%$B[M+oN@!+)q}:__}L1O2aLl(t)Hc5[wMP' );
define( 'LOGGED_IN_SALT',   'pf`FrD$OL<bE)blB90S(]PfPO6E.bX.sO+MDd/@HFjn99/UUcC<j-!JL$34.NqEy' );
define( 'NONCE_SALT',       '#.=!*9#R$IF4u`t&|sH>TsxkWk]Z4vf6k6 adO?W9@~+_>0H.[#aDJn5aN/+0t@.' );

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define( 'WP_DEBUG', false );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname( __FILE__ ) . '/' );
}

/** Sets up WordPress vars and included files. */
require_once( ABSPATH . 'wp-settings.php' );
