function showToast (toast, message, type='success', duration=2000) {
    toast.show(message, {type, duration})
}

export {
    showToast,
}