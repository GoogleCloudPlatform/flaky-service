'''
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
'''

# This python code helps to check and add if necessary the appropriate header to every relevant file.



# DEFINITIONS (inputs)

import os
src_folder = os.getcwd() + "/src/app" # the source folder

# every extension to be considered
src_markup_ext   = ['html']
src_cpp_like_ext = ['ts']
src_css_like_ext = ['css']

# our header
header = '''Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.'''



#CODE

class HeadersDefinitions():
  '''Provides the header with the appropriate comment format'''
  @staticmethod
  def get_header(ext):
    comment_str = ''
    if (ext in src_markup_ext):
      return '<!--\n' + header + '\n-->\n\n'
    elif (ext in src_cpp_like_ext):
      comment_str = '//'
      new_header = comment_str + ' ' + header
      new_header = new_header.replace('\n', '\n' + comment_str + ' ')
      new_header = new_header.replace('\n' + comment_str + ' \n', '\n' + comment_str + '\n') + '\n\n'
      return new_header
    elif (ext in src_css_like_ext):
      return '/*\n' + header + '\n*/\n\n'

class File():
  '''Represents a code file'''
  def __init__(self,path):
    self.path = path
    self.set_ext(path)
  
  def set_ext(self, path):
    splitted_path = self.path.split('.')
    self.ext = splitted_path[len(splitted_path) - 1]

  def update_header(self):
    new_header = HeadersDefinitions.get_header(self.ext)

    if new_header != None:
      file = open(self.path, 'r')
      code = file.read()
      file.close()
      code_is_ok = code.startswith(new_header)

      if not code_is_ok:
        new_code = new_header + code
        file = open(self.path, 'w')
        file.write(new_code)
        file.close()

def check_files(folder):
  for path, subdirs, files in os.walk(src_folder):
      for name in files:
        file_path = os.path.join(path, name)
        File(file_path).update_header()



# LAUNCHER

check_files(src_folder)