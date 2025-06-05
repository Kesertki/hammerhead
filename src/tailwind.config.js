/** @type {import('tailwindcss').Config} */
module.exports = {
	theme: {
		extend: {
			typography: {
				DEFAULT: {
					css: {
						// color: '#333',
						// a: {
						// 	color: '#3182ce',
						// 	'&:hover': {
						// 		color: '#2c5282'
						// 	}
						// }
						'code::before': {
							// content: ''
						},
						'code::after': {
							// content: ''
						}
					}
				}
			}
		}
	}
};
