<?php 
	
	//Capturo parametros procedentes 
	$lat_g = $_POST['lat_g'];
	$lat_m = $_POST['lat_m'];
	$lat_s = $_POST['lat_s'];
	$lat_hemis = $_POST['lat_hemis'];
	
	$lon_g = $_POST['lon_g'];
	$lon_m = $_POST['lon_m'];
	$lon_s = $_POST['lon_s'];
	$lon_hemis = $_POST['lon_hemis'];
	
	//Realizo funcion para el paso de dms a deg
    function dms2deg($g,$m,$s,$h)
    {
		$resultado=0;
		$hemis=1;
		if($h=='S' || $h=='W')
		{
			$hemis = -1;
		}
		$resultado=( (abs($g)) + (abs($m)/60) + (abs($s)/3600));
		$resultado=$resultado*$hemis;
		return $resultado;
    }
	


	//Defino parametros de conexion a la base de datos
	define("PG_DB"  , "mototrip");
	define("PG_HOST", "localhost");
	define("PG_USER", "postgres");  //COLOCAR USUARIO
	define("PG_PSWD", "12345");	//COLOCAR CONTRASEÑA
	define("PG_PORT", "5432");
	
	$dbcon = pg_connect("dbname=".PG_DB." host=".PG_HOST." user=".PG_USER ." password=".PG_PSWD." port=".PG_PORT."");


	
	//Calculo las coordenadas de el punto
	
	$latitud_calculada = dms2deg($lat_g,$lat_m,$lat_s,$lat_hemis);
	$longitud_calculada = dms2deg($lon_g,$lon_m,$lon_s,$lon_hemis);
	
	//echo $latitud_calculada . " , " . $longitud_calculada;
	
	//Usare Postgis para Realizar los calculos de transformacion de coordenadas
	//Este es el sql que se usara para realizar la generacion del punto y su paso de sistema de referncia

	   
	//construyo el sql
	$sql = "SELECT st_x( st_transform(  st_setsrid( st_makepoint($longitud_calculada,$latitud_calculada),4326 )   , 3115 ) ) as coordenada_x_3115,
       st_y( st_transform(  st_setsrid( st_makepoint($longitud_calculada,$latitud_calculada),4326 )   , 3115 ) ) as coordenada_y_3115,
       st_x( st_transform(  st_setsrid( st_makepoint($longitud_calculada,$latitud_calculada),4326 )   , 21896 ) ) as coordenada_x_21896,
       st_y( st_transform(  st_setsrid( st_makepoint($longitud_calculada,$latitud_calculada),4326 )   , 21896 ) ) as coordenada_y_21896";
	//conexion a la db  y ejecutar el sql
	$query = pg_query($dbcon,$sql);
	
	
	//proceso el resultado de la ejecucion del sql en la base de datos
	
	while ($row = pg_fetch_row($query)) 
	{
		echo "Coordenadas en <b>3115</b>:  X: $row[0]  Y: $row[1]";
		echo "<br />";
		echo "Coordenadas en <b>21896</b>:  X: $row[2]  Y: $row[3]";
		echo "<br />";	
	}
	
	

?>