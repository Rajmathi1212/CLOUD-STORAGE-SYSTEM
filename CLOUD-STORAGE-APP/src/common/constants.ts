const API_CODE = {
    API_500: 'internal server error, please contact support.',
    API_401: 'unauthorized user. invalid credentials login.',
    API_404: 'data not found.',
    API_400: 'Bad Request, Check Payload'
}

const API_RESPONSE = {

    API_DUPLICATE_USER: 'duplicate user name. please provider a unique user name.',
    API_UPDATED_DATA: 'data updated successfully',
    API_SUCCESS_DATA: 'success response',
    API_DELETED_DATA: 'data deleted successfully.',
    API_DATA_NOT_FOUND: 'data not found',
    API_USER_REGISTERED_SUCCESSFULLY: 'user registered successfully.',
    API_ADMIN_LOGIN_SUCCESSFULLY: 'admin logged_in successfully.'
}

export default { API_CODE, API_RESPONSE }