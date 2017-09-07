function create(snapshot) {
    return Array.isArray(snapshot) ? snapshot : []
}

module.exports = {
    name: 'ot-rich-text',
    uri: 'https://github.com/Teamwork/ot-rich-text',
    create
}
