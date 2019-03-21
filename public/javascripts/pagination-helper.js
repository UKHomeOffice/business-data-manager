function getPaginationUrl(currLocation, pageNum) {
    if (currLocation.includes('page')) {
        return currLocation.replace(/page=\d+/, `page=${pageNum}`)
    } else if (currLocation.includes('?')) {
        return currLocation += `&page=${pageNum}`
    }
    return currLocation += `?page=${pageNum}`
}

