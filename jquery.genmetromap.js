/*
 плагин генерирующий виджет отображения карты метро
 карта генерится из select списка
    список должен быть следующего формата:
    1) иметь группирующие теги optgroup в которых обязательно должны быть указаны
        поле label (имя линии метро) и цвет элемента (style="color:red" передается всем станциям)
    2) иметь теги для указания параметров станций - option со следующими параметрами:
        поле x и поле y указывающие на координаты левого верхнего угла относительно контейнера
        содержащего карту, а также тег должен содержать какойто текст, который будет использоваться
        как название станции.
 
 после создания списка сгенерировать виджет для каждого из них можно командой:
 
    $('.metro').genMetroMap({
        onSelect: function,
        onDeselect: function,
        onInit: function,
        mapUrl: string
    });
        
        mapUrl - путь до изображения с картой, которая будет играть роль подложки, обязательный параметр
        onSelect() - будет вызван при выборе невыбранной станции, как в списке так и в виджете
        onDeselect() - будет вызван при отмене выбора ранее выбранной станции, как в списке так и в виджете
        в эти 2 метода по ссылке this передается объект содержащий 2 поля:
        {
            option: option, // не обернутый элемент HTMLOption
            button: $(button), //обернутый в jquery элемент HTMLButton 
        }
        
        onInit() - будет вызван в конце построения карты, необходим для пост инициализирующих настроек
        в него в качестве this передается указатель на обернутый в jquery контейнер span в котором
        содержатся карта и кнопки станций
*/
(function($){
    function toggle(option,button,options,full){
        var selected=option.selected;
        /*истина в деталях) full нужен для того чтобы не вызывать смену
         состояния в списке для данной опции (option), при инвертировании флага
         функция синхронизирует состояние кнопки с опцией
        */
        if(!full){
            selected=!selected;
        }
        if(selected){
            //если уже выбран то отмена выбора
            if(full)
                option.selected=false;
            button.toggleClass('selected');
            options.onDeselect.call({'option':option,'button':button});
            
        }
        else{
            if(full)
                option.selected=true;
            button.toggleClass('selected');
            options.onSelect.call({'option':option,'button':button});
            
        }
    }
    $.fn.genMetroMap=function(options){
        options=$.extend({
            onSelect: $.noop,
            onDeselect: $.noop,
            onInit: $.noop,
            mapUrl: null
            
        },options);
        
        if(!options.mapUrl)
            throw new Error('укажите имя файла для параметра mapUrl!');
            
        return this.each(function(){
            // обработаем каждую карту
            // здесь мы в качестве this имеем текущий контейнер <select>
            // соответственно для его содержимого и создаем карту
            
            var select_list=$(this);
            var position=select_list.offset();
            
            var widget=$('<span>').addClass('metro-widget')
                .appendTo($(this).parent())
                .css({
                    position: 'absolute',
                    left: position.left+select_list.width(),
                    top: position.top,
                    
                })
                .hide();
            var container=$('<span>').css({padding:0})
                .addClass('metro-map')
                .appendTo(widget);
                
            select_list.on('focusin',function(){
                widget.fadeIn(500);
            })
            .on('change',function(){
                //беда с обработкой каждого option в select
                //пришлось при каждом изменении списка синхронить с кнопками
                widget.fadeIn(500);
                select_list.find('option').each(function(){
                    //this указывает на option
                    var elem=$(this);
                    var option=this;
                    var status;
                    if(elem.data('buttonWidget').hasClass('selected'))
                        status=true;
                    else
                        status=false;
                    
                    if(option.selected==status){
                        // нельзя вызывать обработчики событий на элементах,
                        // которые не изменились
                        return;
                    }
                    
                    toggle(option,elem.data('buttonWidget'),options,false);
                });
            });
            
            widget.hover(function(){
                widget.fadeIn(500);
            },
            function(){
                widget.fadeOut(500);
            }
            );
            
            $('<img>').attr({src:options.mapUrl}).appendTo(container);
            $(this).find('optgroup').each(function(){
                //обработка каждой группы, будем ее считать за линию метро
                var color=$(this).css('color');
                $(this).find('option').each(function(){
                    //обработка каждого тега option в текущей линии
                    var option=$(this);
                    var html_option=this;
                    
                    var button=$('<button>').css({
                        position:'absolute',
                        backgroundColor:color,
                        left:option.attr('x')+'px',
                        top:option.attr('y')+'px',
                    })
                    .attr('title',option.text())
                    .on('click',function(){
                        toggle(html_option,button,options,true);
                    })
                    
                    .addClass('metro-station')
                    .appendTo(container);
                    option.data({'buttonWidget':button});
                    
                });
                
            });
            options.onInit.call(container);
        });
        
        
    };
})(jQuery);