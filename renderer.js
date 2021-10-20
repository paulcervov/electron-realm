window.electron.sendToMain('Request');
window.electron.receiveFromMain((data) => {
    console.log('From main, data: %s', JSON.stringify(data));
});
