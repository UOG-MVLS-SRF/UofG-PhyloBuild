import docker
import os
# from .customer_lib import find_container, get_all_containers


def refresh_pipeline():
	client = docker.from_env()

	container_name = os.environ["CUSTOM_LIB_CONTAINER"]
	accessory_data_volume = os.environ["ACCESSORY_DATA_VOLUME"]

	try:
		container = client.containers.get(container_name)

		container_name = container.name
		image_name = container.attrs["Config"]["Image"]
		ports = container.attrs["HostConfig"]["PortBindings"]
		memory_limit = container.attrs["HostConfig"]["Memory"]

		container.stop()
		container.remove()

		container = client.containers.run(
			image=image_name,
			command="tail -f /dev/null",
			name=container_name,
			ports=ports,
			detach=True,
			mem_limit=memory_limit,
			volumes={
				"/var/run/docker.sock": {
					"bind": "/var/run/docker.sock",
					"mode": "rw",
				},
				"accessory-data_volume": {
					"bind": "/app/accessory-data",
					"mode": "rw",
				},
			},
		)

		exit_code, output = container.exec_run(
			"echo 'we are happy'"
		)

	except docker.errors.NotFound:
		print(
			f"Container {container_name} does not exist."
		)
	except Exception as e:
		print(
			f"An error occurred: {e}"
		)