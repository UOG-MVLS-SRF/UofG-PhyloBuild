import signal
import time
from contextlib import contextmanager

class TimeoutException(Exception): pass

def time_tamplate(target:str):
    #in time class
    second=1
    one_min=second*60
    hour=one_min*60
    day=hour*24
    template={"second":second,"one_min":one_min,"hour":hour,"day":day}
    return template[target]


#this is only work in ubuntu or unix system since using signum
@contextmanager
def time_limit(seconds):
    def signal_handler(signum, frame):
        raise TimeoutException("Timed out!")
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)



if __name__ == "__main__":
    seconds=10*time_tamplate("second")
    try:
        with time_limit(seconds):
            for i in range(100):
                print("Time in?")
                time.sleep(1)
    except TimeoutException as e:
        print("Timed out!")