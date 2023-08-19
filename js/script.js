// Form validation example
document.querySelector('form').addEventListener('submit', function(event) {
    const nameInput = document.querySelector('#name');
    const emailInput = document.querySelector('#email');
    const messageInput = document.querySelector('#message');
  
    if (nameInput.value === '' || emailInput.value === '' || messageInput.value === '') {
      alert('Please fill in all fields.');
      event.preventDefault();
    }
  });