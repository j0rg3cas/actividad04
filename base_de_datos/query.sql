create table conteo(id serial, geom geometry);

create or replace function contar(lat float,lng float)
returns int as $$
declare
a int;
begin
	insert into conteo(geom) values (st_setsrid(st_makepoint(lat,lng),4326));
	a = (select count(geom) from conteo);
	return a;

end;
$$language plpgsql;

