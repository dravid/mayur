export function isValidEmail(value) {
	let filter = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	return filter.test(value);
}
export function isValidPassword(value, criteria = 'weak') {
	if (criteria === 'weak') {
		// Password must have minimum 8 characters
		return value.length >= 8;
	}
	else if (criteria === 'strong') {
		// Password must have minimum 8 characters, at least one letter and one number
		let filter = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
		return filter.test(value);
	}

	return true;
}