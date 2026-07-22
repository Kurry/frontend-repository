import subprocess
import urllib.request
import json
import base64
import os

def get_file(blob_sha, out):
    # we don't have it locally, so we'll fetch from github tree API but we don't have token...
    # let's use gh api
    pass
