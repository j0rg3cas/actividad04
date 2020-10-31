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

	//Calculo las coordenadas de el punto
	
	$latitud_calculada = dms2deg($lat_g,$lat_m,$lat_s,$lat_hemis);
	$longitud_calculada = dms2deg($lon_g,$lon_m,$lon_s,$lon_hemis);
	
	echo 'Coordenadas calculadas : <b>'. $latitud_calculada . " , " . $longitud_calculada . '</b>';

?>