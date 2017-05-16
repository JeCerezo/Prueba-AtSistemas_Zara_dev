$(document).ready(function(){
    var dataPodcastList;

     //El json con el que sacamos la lista inicial de podcast se guarda inicialmente en localStorage. 
     //Con la funci�n asignada a la variable 'init', comparamos si ya habido una carga de datos del json
     //desde la ruta hacia localStorage para la vista principal en las �ltimas 24 horas. 
     //Si ya ha habido una carga de datos, recurriremos a localStorage; si no la ha habido, 
     //volveremos a cargar el json desde la ruta y lo almacenaremos en memoria*/
    
    var fechaActual = new Date().getTime();
    var dia = 60*1000*60*24;
    
    //Con estas dos variables globales, cogemos el valor en ms de la fecha actual + 1 d�a para despu�s 
    //compararlo con la fecha (almacenada en el item 'lastUpdates') tomada en la posterior funci�n 
    //asignada a 'getDataPodcasts'. As� nos aseguramos de no hacer una nueva carga de datos 
    //desde el json si ya la hemos hecho durante las �ltimas 24 horas
    
    var init = function(){
            
        if(localStorage.getItem('lastUpdates') && localStorage.getItem('podcastList')){
            if(parseInt(localStorage.getItem('lastUpdates'))+dia <= fechaActual){
                getDataPodcasts();
            }else{
                dataPodcastList = JSON.parse(localStorage.getItem('podcastList'));
                createInterface(dataPodcastList.feed.entry); 
            }
        }else{
            getDataPodcasts();
        }
    };
    //
    
    
    //Con la siguiente funci�n cargamos los datos desde el json de la url
    
    var getDataPodcasts = function(){
        $('#loader').show();
        $.ajax({
            type:"GET",
            url:'https://itunes.apple.com/us/rss/toppodcasts/limit=100/genre=1310/json',
            dataType:"json",
            success: function(json){
                localStorage.setItem('podcastList', JSON.stringify(json)); //Almacenamos el json en localStorage
                localStorage.setItem('lastUpdates', String(new Date().getTime()));//Almacenamos la fecha de carga
                                                                                  //del json en localStorage  
                dataPodcastList = json.feed.entry;
                createInterface(dataPodcastList);           
            },
            error: function(){
                console.log('no se ha cargado el json');
            },
            complete: function(){
                $('#loader').hide();
            }
        });
    };
    
    //Con la siguiente funci�n createDataInterface pintamos los datos cargados 
    //con la funci�n getDataPodcasts y/o almacenados en localStorage.
    var createInterface = function(data){
        if(data){
            $('.podcast-list').show();
            $("#search,#counter").show();
            $('.podcast-detail').hide();
            $('#episode').hide();
            console.log(data);
            $(".podcast-list").empty();
            $("#counter").text(data.length);
            $.each(data, function(i,entrada){
                $(".podcast-list").append("<div class='podcast' data-id='"+entrada.id.attributes['im:id']+"'><img src='"+entrada['im:image'][2].label+"' alt='"+entrada['im:name'].label+"' /><h2>"+entrada['im:name'].label+"</h2>Author: <h3>"+entrada['im:artist'].label+"</h3></div>");                               
            });
            $('.podcast').click(function(e){
                var id = $(this).attr("data-id");
                console.log(id);               
                //Al igual que hicimos en la funci�n init para cargar el listado del podcast, creamos un filtro
                //a trav�s de una serie de condicionales para efectuar la carga de los datos
                //de cada podcast concreto o bien desde localStorage (en caso de habr sido cargados
                //antes de 24 horas desde la �ltima vez) o desde petici�n directa hacia la URL del RSS
                //del podcast (si llevamos m�s de 24 horas sin cargar datos de ese podcast).
                if(localStorage.getItem(id)){
                    if(parseInt(localStorage.getItem(id.TakeDate))+dia <= fechaActual){
                        getPodcastDetailUrl(id);                        
                    }else{
                        console.log(id);
                        createPodcastDetail(id);                        
                    }
                }else{
                    getPodcastDetailUrl(id);                    
                }
                page('/podcast/'+id);
            });
              
        } 
    };
    
    //Con la funci�n createPodcastDetail, pintamos los datos de la vista detalle del podcast tras
    //haber sido cargados con la funci�n getPodcastDetail o tomados desde localStorage.
    var createPodcastDetail = function(id){
        if(id){
            //Modificamos la variable 'id' para identificarla con 
            //el nombre del objeto que hemos guardado en localStorage 
            id = JSON.parse(localStorage.getItem(id));
            console.log(id);
            $('.podcast-list').hide();
            $('.podcast-detail').show();
            $(".podcast-detail").empty();
            $("#search,#counter").css('display','none');
            $(".podcast-detail").append(
                "<div id='menuleft'>"+
                "<img src='"+id.image+"'/>"+
                "<h2>"+id.title+"</h2>"+
                "<h3>by "+id.author+"</h3>"+
                "<h4>Description:</h4>"+
                "<p id='description'>"+id.description+"</p>"+
                "</div>"+
                "<div id='counterright'></div>"+
                "<div id='list'>"+
                    "<table>"+
                        "<tr id='tabletitles'>"+
                            "<td>Title</td>"+
                            "<td>Date</td>"+
                            "<td>Duration</td>"+
                        "</tr>"+        
                    "</table>"+
                "</div>");
            //aqu� va el each si tuviera un array con las canciones del podcast.
            $.each(id.episodes,function(i){
                $(".podcast-detail table").append(
                    "<tr class='tablefile'>"+
                            "<td class='title'>"+id.episodes[i].title+"</td>"+
                            "<td>"+id.episodes[i].date+"</td>"+
                            "<td>"+id.episodes[i].duration+"</td>"+
                        "</tr>"
                );                               
                $('#counterright').text("Episodes: "+id.episodes.length);                
                
            });            
            //Aqu� Introducimos el evento click que carga el detalle del episodio
            $('.title').click(function(){                    
                var title = $(this).text();                
                var currentURL = document.URL;
                console.log(currentURL);
                $.each(id.episodes,function(i,index){
                    if(id.episodes[i].title == title){
                        $('#episode').append(   
                            "<h2>"+id.episodes[i].title+"</h2>"+
                            "<p>"+id.episodes[i].description+"</p>"+
                            "<audio src='"+id.episodes[i].audio+"' controls></audio>"
                        );
                        window.history.replaceState(null,null,currentURL+'/Episode/'+id.episodes[i].title);
                    }
                    //Hemos tomado como variable el nombre del podcast para hacer la b�squeda comparando
                    //con los nombres de cada objeto del json 'episodes', list�ndolos con un each. 
                    //Cuando los nombres coincidan, pintaremos los datos seleccionados.
                    //Para a�adir a la URL el nombre del episodio seleccionado, usamos la funci�n history.pushState
                });               
                $('#episode').show();
                $('#counterright,#list').hide();                
                //Ahora daremos un evento click al detalle del podcast para volver a mostrar el listado
                $('#menuleft').click(function(){
                    $('#episode').empty().hide();
                    $('#counterright,#list').show();
                    window.history.replaceState(null,null,currentURL);
                });
            });
        };
    };
            
    



    //Con la funci�n change, comparamos los datos introducidos en el buscador 
    //con los t�tulos y artistas de los Podcast
    $('#search').change(function(){
        filtro = $(this).val(); //Almacenamos el valor del buscador en est variable
        if(filtro){
        var myData = $.extend({},dataPodcastList); //Creamos un array vac�o para llenarlo con los datos del json
                                                   //de la vista inicial
        var filteredData = myData.feed.entry.filter(function(item){
            //Creamos una variable asociada a una funci�n que filtrar� y nos devolver� aquellas entradas del json cuyos
            //t�tulos y artistas coincidan con los introducidos en el buscador
            return item['im:name'].label.indexOf(filtro) != -1 || item['im:artist'].label.indexOf(filtro) != -1; 
        });
        createInterface(filteredData); //Invocamos la funci�n que pinta la vista principal,
                                       //pero solo con los datos del filtro
        }else{
            $('.podcast').show();
            createInterface(dataPodcastList.feed.entry);
        }           
    }).keyup(function(){ //Concatenando la funci�n keyup, nos aseguramos de que la funci�n change
                        //s�lo act�e al soltar las teclas cuando tecleamos.
       $(this).change(); 
    });
    
    
    
    // Hacemos la petici�n de la URL donde est� el XML de donde sacaremos los datos para pintar
    //el detalle del podcast.
    var getPodcastDetailUrl = function(id){
        $('#loader').show();
        console.log(id);
        var url = "https://crossorigin.me/https://itunes.apple.com/lookup?id="+id;
        $.ajax({
            type:"GET",
            url:url,
            dataType:"json",
            success: function(json){
                    var url = json.results[0].feedUrl;
                    /*localStorage.setItem(id,String(new Date().getTime()))*/; //Guardamos la fecha en la que hicimos
                                                                           //la petici�n de la url
                    getPodcastDetail(url,id);
                    console.log(url);
            },
            error: function(){
                console.log('no se ha cargado el json');
            },
            complete: function(){
                //alert('fin del proceso');
                   $('#loader').hide();
            }
        });
    };
    
    
    
    //Con la siguiente funci�n cargamos los datos en XML a trav�s de la URL pasada
    //a trav�s de la anterior funci�n
    var getPodcastDetail = function(url,id){
        $('#loader').show();
        $.ajax({
            type:"GET",
            url:"https://crossorigin.me/"+url,
            success:function(data){
                    console.log(data);
                    //En las dos siguientes variables, cargamos los datos del detalle del podcast
                    //y el listado de los episodios con sus detalles por otro
                    var dataPod = {
                        TakeDate: String(new Date().getTime()),
                        title : $(data).find('channel > title').text(),
                        author : $(data).find('channel > copyright').text(),
                        description : $(data).find('channel > description').text(),
                        image : $(data).find('image > url').text(),
                        episodes : []
                    };
                    $(data).find('item').each(function(i){
                        dataPod.episodes.push({
                          title: $(this).find('title').text(),
                          description: $(this).find('description').text(),
                          duration: $(this).find('itunes\\:duration').text(),
                          date: $(this).find('pubDate').text(),
                          audio: $(this).find('enclosure').attr('url')
                          });                                   
                    });
                    //Ahora guardamos ambos conjuntos de datos en localStorage como string
                    //con la intenci�n de poder cargarlos desde ah� si lo necesitamos, 
                    //y despues los devolvemos a su estado de ficheros json para su uso en
                    //la funci�n createPodcastDetail.
                    localStorage.setItem(id,JSON.stringify(dataPod));
                    createPodcastDetail(id);
            },
            error: function(){
                console.log('no se ha cargado el json');
            },
            complete: function(){
                    $('#loader').hide();
            }
        });
    };
    
    
    
    $('h1').click(function(){
        page('/'); //con la funcion page, al hacer click en el t�tulo de la p�gina la url se vac�a
    });

    page('/', init);/*con la misma funci�n page, cuando la url est� vac�a,
                 se invoca la funci�n init que carga la vista principal*/

    page('/podcast/:id', function(context){
        var id = context.params.id; //en la funcion page, usamos el parametro context, junto con params
                                           // para tomar un elemento de la url, en este caso el id                                    
    });
    
    
    
    page(); //con esta funci�n iniciamos la librer�a page() de node.js




    
});



