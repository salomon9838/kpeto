# medecine/local_settings.py
# Overrides locaux pour settings.py

# Développement uniquement
DEBUG = True

# Base de données locale (si différente)
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'santes_db_dev',
#         'USER': 'postgres',
#         'PASSWORD': 'sam9838*',
#         'HOST': 'localhost',
#         'PORT': '5432',
#     }
# }

# Email en console (pour dev)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'



print("✅ Local settings chargés !")  # Pour vérifier que ça marche