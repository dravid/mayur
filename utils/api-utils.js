export function encodeForm(formData) {
	return Object.keys(formData).map((key) => {
		return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
	}).join('&');
}