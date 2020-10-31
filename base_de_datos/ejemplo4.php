<?php 

  //configuracion de la conexion a la base de datos

   include('configuracion.php');
   
   session_start();
   
   if(!isset($_POST['peticion']))
   {
	$_POST['peticion'] = "peticion";
   }

   if(!isset($_POST['parametros']))
   {
	$_POST['parametros'] = "parametros";
   }
   
   $peticion = $_POST['peticion'];
   $parametros = $_POST['parametros'];
   
   switch($peticion)
   {
		case 'borrar':
		{

			$sql = "delete from conteo;";

   
			$query = pg_query($dbcon,$sql);
			$row = pg_fetch_row($query);
			echo $row[0];
			break;
		}
		
		case 'contar':
		{
			$lat = $parametros['y'];
			$lng = $parametros['x'];
			$sql = "select contar($lat,$lng);";

   
			$query = pg_query($dbcon,$sql);
			$row = pg_fetch_row($query);
			echo $row[0];
			break;
		}
   }
    

?>