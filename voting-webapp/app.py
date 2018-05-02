from flask import Flask
from flask import render_template

app = Flask(__name__)

@app.route('/')
@app.route('/admin')
def election_admin():
    return render_template('index.html')

@app.route('/submit-secret')
def interested_third_party():
    return render_template('secret.html')

@app.route('/vote')
def vote():
    return render_template('voter.html')

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0')