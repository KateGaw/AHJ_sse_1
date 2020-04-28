import moment from 'moment';

class Widget {
    constructor(url) {
        this.url = url;
    }

    init() {
        this.widget = document.querySelector('#widget');
        this.widgetList = document.querySelector('.widget-list');
        this.events();
    }

    addMessage(message) {
        const {
            type,
            mess,
            date,
            id,
        } = JSON.parse(message);
        this.itemMesage = document.createElement('li');
        this.itemMesage.className = 'li-msg';
        this.itemMesage.dataset.id = id;

        let imgContainer;
        if (type === 'freekick') {
            imgContainer = '<img src=\'warn.png\'></img>';
        } else if (type === 'goal') {
            imgContainer = '<img src=\'goal.png\'></img>';
        } else {
            imgContainer = '<img class=\'img\'></img>';
        }

        this.itemMesage.innerHTML = `
          ${imgContainer}
          <div">
            <span>${moment(date).format('DD.MM.YY - HH:mm:ss')}</span>
            <p>${mess}</p>
           </div>
        `;

        this.widgetList.appendChild(this.itemMesage);
        this.widget.scrollTop = 9999;
    }

    events() {
        const eventSource = new EventSource(this.url);

        eventSource.addEventListener('open', () => {
            console.log('connected');
        });

        eventSource.addEventListener('error', (event) => {
            console.log(event);
        });

        eventSource.addEventListener('comment', (event) => {
            this.addMessage(event.data);
        });
    }
}

new Widget('https://sse-1.herokuapp.com/match').init();