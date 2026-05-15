web: python manage.py migrate && python init_db.py && python seed_data.py && python manage.py collectstatic --noinput && gunicorn fix487.wsgi --bind 0.0.0.0:$PORT --access-logfile - --log-file -
