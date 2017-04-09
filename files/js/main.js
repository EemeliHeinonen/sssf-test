'use strict';

let originalData = null;
let map = null;
let marker = null;

document.querySelector('#reset-button').addEventListener('click', () => {
    update(originalData);
});

const createCard = (image, title, texts) => {
    let text = '';
    for (let t of texts){
        text += `<p class="card-text">${t}</p>`;
    }

    return `<img class="card-img-top" src="${image}" alt="">
            <div class="card-block">
                <h3 class="card-title">${title}</h3>
                ${text}                
            </div>
            <div class="card-footer">
                <p><button class="btn btn-primary">View</button></p>
            </div>`;
};

const categoryButtons = (items) => {
    items = removeDuplicates(items, 'category');
    console.log(items);
    document.querySelector('#categories').innerHTML = '';
    for (let item of items) {
        const button = document.createElement('button');
        button.class = 'btn btn-secondary';
        button.innerText = item.category;
        document.querySelector('#categories').appendChild(button);
        button.addEventListener('click', () => {
            sortItems(originalData, item.category);
        });
    }
};

const sortItems = (items, rule) => {
    const newItems = items.filter(item => item.category === rule);
    update(newItems);
};

const getData = (query) => {
    fetch('/posts')
        .then(response => {
            return response.json();
        })
        .then(items => {
            originalData = items;
            update(items);
        });
    if (query != null) {
        fetch('/posts/'+query)
            .then(response => {
                return response.json();
            })
            .then(items => {
                originalData = items;
                update(items);
            });
    }

};

const removeDuplicates = (myArr, prop) => {
    return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
};

const update = (items) => {
    categoryButtons(items);
    document.querySelector('.card-deck').innerHTML = '';
    for (let item of items) {
        // console.log(item);
        const article = document.createElement('article');
        article.setAttribute('class', 'card');
        const time = moment(item.time);
        article.innerHTML = createCard(item.thumbnail, item.title, ['<small>'+time.format('dddd, MMMM Do YYYY, HH:mm')+'</small>', item.details]);
        article.addEventListener('click', () => {
            document.querySelector('.modal-body img').src = item.image;
            document.querySelector('.modal-title').innerHTML = item.title;
            resetMap(item);
            document.querySelector('#map').addEventListener('transitionend', () => {
                resetMap(item);
            });
            const myModal = $('#myModal');
            myModal.on('shown.bs.modal', () => {
                resetMap(item);
            });
            myModal.modal('show');
        });

        const selectOptionUpdate = document.createElement('option');
        const selectOptionDelete = document.createElement('option');
        selectOptionUpdate.value = item.title;
        selectOptionUpdate.innerText = item.title;
        selectOptionDelete.value = item.title;
        selectOptionDelete.innerText = item.title;
        document.querySelector('.card-deck').appendChild(article);
        document.querySelector('#select-update-spy').appendChild(selectOptionUpdate);
        document.querySelector('#select-delete-spy').appendChild(selectOptionDelete);
    }
};

const initMap = () => {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11
    });
    marker = new google.maps.Marker({
        map: map
    });
    getData();
};

const resetMap = (item) => {
    const coords = item.coordinates;
    console.log(coords);
    google.maps.event.trigger(map, "resize");
    map.panTo(coords);
    marker.setOptions({
        position: coords
    });
};

initMap();

// add new
document.querySelector('#spyForm').addEventListener('submit', (evt) => {
    evt.preventDefault();
    const data = new FormData(evt.target);
    const fileElement = event.target.querySelector('input[type=file]');
    const file = fileElement.files[0];
    data.append('file', file);

    const url = '/new';

    fetch(url, {
        method: 'post',
        body: data
    }).then((resp)=> {
        // console.log(resp);
        getData();
        $('#myTabs a:first').tab('show');
    });
});


// update document
document.querySelector('#spyForm-update').addEventListener('submit', (evt) => {
    evt.preventDefault();
    const data = new FormData(evt.target);
    const fileElement = event.target.querySelector('input[type=file]');
    const file = fileElement.files[0];
    data.append('file', file);
    const spyIndex = document.getElementById('select-update-spy').selectedIndex;
    const mSpy = originalData[spyIndex]._id;
    data.append('id', mSpy);

    const url = '/patch';

    fetch(url, {
        method: 'PATCH',
        body: data
    }).then((resp)=> {
         console.log(resp);
        getData();
        $('#myTabs a:first').tab('show');
    });
});

// delete cat
document.querySelector('#spyForm-delete').addEventListener('submit', (evt) => {
    evt.preventDefault();
    const spyIndex = document.getElementById('select-delete-spy').selectedIndex;
    const mSpy = originalData[spyIndex]._id;
    const data = new FormData();
    data.append('id',mSpy);

    const url = '/delete';

    fetch(url, {
        method: 'delete',
        body: data
    }).then((resp)=> {
        // console.log(resp);
        getData();
        $('#myTabs a:first').tab('show');
    });
});

document.getElementById('searchButton').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value;
    getData(searchQuery);
});
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    const key = e.which || e.keyCode;
    if (key === 13) {
        const searchQuery = document.getElementById('searchInput').value;
        getData(searchQuery);
    }
});


// listener for select options
document.getElementById('select-update-spy').addEventListener('change', () => {
    const spyIndex = document.getElementById('select-update-spy').selectedIndex;
    const mSpy = originalData[spyIndex];

    document.getElementById('category-update').value = mSpy.category;
    document.getElementById('title-update').value = mSpy.title;
    document.getElementById('details-update').value = mSpy.details;
});

// update values for the current selection when moving to the update tab
$('#tab-update').click(function (e) {
    const spyIndex = document.getElementById('select-update-spy').selectedIndex;
    const mSpy = originalData[spyIndex];

    document.getElementById('category-update').value = mSpy.category;
    document.getElementById('title-update').value = mSpy.title;
    document.getElementById('details-update').value = mSpy.details;
});


// init tabs
$('#myTabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
});