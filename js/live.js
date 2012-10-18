$(document).ready(function(){
	// 图片展示
	$('.picture a').fancybox();

	var news_num = get_news_num();
	var current_news_start = 20;

	// 查看更多新闻
	$('#showMore').click(function(){
		$this = $(this);
		$this.addClass('loading');

		$.get(
			'api.php',
			{
				intent: 'get_live_news',
				start: current_news_start,
				length: 10
			},
			function(data){
				var parent = $this.parent().parent();

				parent.before(data);
				current_news_start += 10;
				$this.removeClass('loading');
				$('a.comment').each(show_comment);

				if (current_news_start > news_num)
				{
					parent.hide();
				}
			}
		);

		return false;
	});

	// 显示评论
	$('a.comment').each(show_comment);

	function show_comment()
	{
		var $this = $(this);
		var id = parseInt($this.attr('id'));
		var $comment;

		$this.click(function() {
			
			if ($this.hasClass('loaded'))
			{
				$comment.toggle();
			}
			else
			{
				// 评论输入框
				$this.parent().parent().parent().parent().after(
					'<div class="comment" id="' + id + '_comment">' +
						'<div class="comment_form">' +
							'<div>' +
								'<textarea class="comment textedit"></textarea>' +
							'</div>' +
							'<div class="submit">' +
								'<button type="submit" class="button">发送</button>' +
							'</div>' +
						'</div>' +
					'</div>'
				);

				$comment = $('#' + id + '_comment');
				$comment_input = $('textarea.comment', $comment);
				$this.addClass('loaded');

				// Ajax 获取评论
				$.get(
					'api.php',
					{
						intent: 'get_live_comment',
						follow: id
					},
					function(data){
						$comment.append(data);

						// 回复
						$('a.reply', $comment).click(function(){
							var $username = $('strong', $(this).parent().parent().parent().parent().parent());
							var username = $username.text();
							$comment_input.val('@' + username + ' ').focus();
							return false;
						});
					}
				);

				// 发送评论
				$('button', $comment).click(function(){
					$.post(
						'api.php?intent=send_comment&follow=' + id,
						{comment: $comment_input.val()},
						function(data) {
							if (data == '')
							{
								alert('评论成功');
								$comment_input.val('');
							}
							else
							{
								alert(data);
							}
						}
					);

					return false;
				});
			}

			return false;
		});
	}

	function get_news_num()
	{
		var num;

		$.ajax({
			url: 'api.php',
			data: {intent: 'get_news_num'},
			async: false,
			success: function(data){
				num = parseInt(data);
			}
		});

		return num;
	}


	// 验证登陆注册表单
	(function (){

		// 检查输入是不是正确
		var check_bool = {
			email: false,
			name: false,
			password: false,
			password_again: false
		};

		// 验证方式
		var check_way = {
			email: function(){
				return $('#email').val().search(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]{2,3}$/g) == -1;
			},
			name: function(){
				var has_name;
				$.ajax({
					url: 'api.php?intent=has_name',
					type: 'POST',
					data: {name: $('#name').val()},
					async: false,
					success: function(data){
						has_name = (data == 'had');
					}
				});
				return has_name;
			},
			password: function(){
				return $('#password').val().length <= 3
			},
			password_again: function(){
				return $('#password').val() != $('#password_again').val();
			}
		};

		// 验证邮箱
		check_error('email', '请输入正确的邮箱!', check_way.email);

		// 验证昵称
		check_error('name', '昵称已存在!', check_way.name);

		// 验证密码
		check_error('password', '密码过短', check_way.password);

		// 验证第二次密码
		check_error('password_again', '两次密码不相同!', check_way.password_again);

		// 验证绑定
		function check_error(input_name, addContent, check)
		{
			var $input_node = $('#' + input_name);

			$input_node.blur(function(){
				show_check(input_name, check);
				if (
					check_bool.email &&
					check_bool.name &&
					check_bool.password &&
					check_bool.password_again
				)
				{
					$("#submit").removeClass("invalid");
				}
				else {
					$("#submit").addClass("invalid");
				}
			});
			$input_node.focus(function(){
				hide_check(input_name);
			});
			$input_node.after(
				'<span class="error" >' +
					addContent + 
				'</span>' +
				'<span class="ok" >' +
				'</span>'
			);
			hide_check(input_name);
			$("#submit").addClass("invalid");
		}
		
		// 显示验证
		function show_check(input_name, check){
			var $input_node = $('#' + input_name);
			if ($input_node.val() == '')
			{
				eval('check_bool.' + input_name + ' = false');
			}
			else if (check())
			{
				$('p.' + input_name + ' .error').show();
				eval('check_bool.' + input_name + ' = false');
			}
			else
			{
				$('p.' + input_name + ' .ok').show();
				eval('check_bool.' + input_name + ' = true');
			}
		}
		// 隐藏验证
		function hide_check(input_name)
		{
			$('p.' + input_name + ' .error').hide();
			$('p.' + input_name + ' .ok').hide();
		}

		
		// 提交表单事件控制
		$('#register_form').submit(function(){
			if (
				check_bool.email &&
				check_bool.name &&
				check_bool.password &&
				check_bool.password_again
			)
			{
				return true;
			}
			else
			{
				show_check('email', check_way.email);
				show_check('name', check_way.name);
				show_check('password', check_way.password);
				show_check('password_again', check_way.password_again);
				return false;
			}
		});

	})();


	// 弹出、隐藏，登录、注销
	$('div.personal').click(function(){
		$('.login_and_logout').toggle();
	});

	// 翻页
	$('#toolbar .center').css('display', 'inline-block');

	// 控制按钮，上下翻页，回到首页
	(function(){
		// 按钮点击事件
		$('#btn_down').click(function(){
			goto_news('down');
			return false;
		});
		$('#btn_up').click(function(){
			goto_news('up');
			return false;
		});
		$('#btn_top').click(function(){
			goto_news('top');
			return false;
		});

		// 跳转新闻
		function goto_news(arg)
		{
			$body = (window.opera) ? (document.compatMode == "CSS1Compat" ? $('html') : $('body')) : $('html,body');
			var scrollTop = $(window).scrollTop();
			options = {
				speed: 'slow',
				easing: 'easeOutExpo',
				queue: false
			};
			var i = 0;
			var diff = 20;
			for (; i < $('#body > .news').length; i++)
			{
				var i_top = $("#body > .news:eq(" + i + ")").offset().top;
				if (i_top - scrollTop >= diff) {
					if (arg != 'up') i--;
					break;
				}
				if (i_top - scrollTop < diff && i_top - scrollTop > - diff) break;
			}
			if (i == -1) i = 0;
			switch (arg)
			{
				case 'up': 
					i = (i == 0 || i == 1) ? 0 : $("#body > .news:eq(" + (i - 1) + ")").offset().top;
					break;
				case 'down':
					i = $("#body > .news:eq(" + (i + 1) + ")").offset().top;
					break;
				case 'top':
					i = 0;
					break;
				case 'bottom':
					i = $(document).height();
					break;
			}
			$body.animate({scrollTop: i}, options);
		}
	})();
});

// 阻尼动画切换效果
$.extend(
	$.easing, {
		easeOutExpo: function (x, t, b, c, d) {
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		}
	}
);

